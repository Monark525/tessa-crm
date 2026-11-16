'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Building2, UserCircle, ArrowRight, AlertTriangle, Briefcase, ShieldCheck } from 'lucide-react';

export default function OnboardingScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('Admin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser] = useState<any>(null);

  // Check if a user is actually logged in before letting them onboard
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    };
    checkAuth();
  }, [router]);

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!user) {
      setErrorMsg('Authentication error. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      // 1. Create the new Company in the database using the exact column name 'company_name'
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{ company_name: companyName }]) 
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Create the User Profile linked to the new Company
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id, // Links directly to the Supabase Auth ID
          company_id: companyData.id,
          full_name: fullName,
          role: role
        }]);

      if (profileError) throw profileError;

      // 3. Route them to the next step in the funnel (Pricing)
      router.push('/pricing');
      
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'An error occurred while creating your workspace.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading secure gateway...</div>;

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-900/50 border border-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-900/20">
            <Building2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Configure Workspace
          </h1>
          <p className="text-slate-400 text-sm">
            Set up your company profile to initialize your Tessa CRM environment.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleOnboarding} className="space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserCircle className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="e.g., John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Company Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="e.g., Tessa Holdings Group LLC"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">System Role</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <ShieldCheck className="h-5 w-5 text-slate-500" />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors appearance-none"
              >
                <option value="Admin">Administrator (Full Access)</option>
                <option value="Manager">Manager (Team Access)</option>
                <option value="Agent">Agent (Standard Access)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? 'Configuring...' : 'Proceed to Plan Selection'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

      </div>
    </main>
  );
}