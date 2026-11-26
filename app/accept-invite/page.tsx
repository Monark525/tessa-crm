'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, User, Lock, ArrowRight } from 'lucide-react';

export default function AcceptInvitePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setVerifyingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setVerifyingSession(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      return setError('Please enter your full name or username.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      // 1. Save password & display name on the user's Auth account
      const { data: updatedAuth, error: updateAuthError } = await supabase.auth.updateUser({
        password,
        data: { full_name: fullName.trim() },
      });

      if (updateAuthError) throw updateAuthError;

      const user = updatedAuth.user;
      if (user) {
        const companyId = user.user_metadata?.company_id;
        const role = user.user_metadata?.role || 'agent';

        // 2. Update public.profiles with their chosen username & company_id
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: fullName.trim(),
            ...(companyId ? { company_id: companyId } : {}),
            role,
          });

        if (profileError) throw profileError;

        // 3. Mark their invitation as 'accepted' in public.company_invitations
        if (user.email && companyId) {
          await supabase
            .from('company_invitations')
            .update({ status: 'accepted' })
            .eq('company_id', companyId)
            .eq('email', user.email.toLowerCase())
            .eq('status', 'pending');
        }
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to complete account setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-600/20 p-3 rounded-xl border border-indigo-500/30">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Accept Team Invite</h1>
            <p className="text-xs text-slate-400">Set your username and password to join Tessa CRM</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleCompleteSetup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Full Name / Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Create Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || verifyingSession}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition mt-2"
          >
            {verifyingSession
              ? 'Verifying Invite Link...'
              : loading
              ? 'Saving Account...'
              : 'Complete Setup & Enter Workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}