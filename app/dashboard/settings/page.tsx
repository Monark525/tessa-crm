'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import {
  Settings, ArrowLeft, Building2, Users, Mail, Phone,
  User, Shield, Save, Plus, CheckCircle2, X, Send
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [emailSettings, setEmailSettings] = useState<any>(null);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');

  // Invite Member
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviting, setInviting] = useState(false);

  const isAdmin = profile?.role !== 'agent';
  
  const fetchTeamMembers = async (companyId: string) => {
  const { data: teamData } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });

  if (teamData) setTeam(teamData);
};
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select(`
          id, full_name, role, company_id,
          companies (id, company_name, subscription_status, wallet_balance, twilio_subaccount_sid)
        `)
        .eq('id', session.user.id)
        .single();

      if (!profileData) return;

      setProfile(profileData);
      setFullName(profileData.full_name || '');
      // @ts-ignore
      setCompany(profileData.companies);
      // @ts-ignore
      setCompanyName(profileData.companies?.company_name || '');

      if (profileData.role !== 'agent') {
        const { data: teamData } = await supabase
          .from('profiles')
          .select('id, full_name, role, created_at')
          .eq('company_id', profileData.company_id)
          .order('created_at', { ascending: true });

        if (teamData) setTeam(teamData);
      }

      const { data: emailData } = await supabase
        .from('company_email_settings')
        .select('*')
        .eq('company_id', profileData.company_id)
        .maybeSingle();

      if (emailData) {
        setEmailSettings(emailData);
        setSenderName(emailData.sender_name || '');
        setSenderEmail(emailData.sender_email || '');
      }

      const { data: phonesData } = await supabase
        .from('company_phone_numbers')
        .select('*')
        .eq('company_id', profileData.company_id)
        .order('created_at', { ascending: false });

      if (phonesData) setPhoneNumbers(phonesData);

      setLoading(false);
    };

    load();
  }, [router]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const saveProfile = async () => {
    if (!fullName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', profile.id);

      if (error) throw error;
      setProfile({ ...profile, full_name: fullName.trim() });
      showMessage('success', 'Profile updated successfully');
    } catch (err: any) {
      showMessage('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveCompany = async () => {
    if (!companyName.trim() || !isAdmin) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ company_name: companyName.trim() })
        .eq('id', company.id);

      if (error) throw error;
      setCompany({ ...company, company_name: companyName.trim() });
      showMessage('success', 'Company name updated');
    } catch (err: any) {
      showMessage('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEmailSettings = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const payload = {
        company_id: profile.company_id,
        sender_name: senderName.trim(),
        sender_email: senderEmail.trim(),
        updated_at: new Date().toISOString(),
      };

      if (emailSettings) {
        const { error } = await supabase
          .from('company_email_settings')
          .update(payload)
          .eq('company_id', profile.company_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_email_settings')
          .insert(payload);
        if (error) throw error;
      }

      showMessage('success', 'Email settings saved successfully');
    } catch (err: any) {
      showMessage('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // ===== INVITE MEMBER =====
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Your session expired. Please refresh and try again.');
      }

      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      await fetchTeamMembers(profile.company_id);
      showMessage('success', `Invitation link sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      setInviteRole('agent');
      setIsInviteOpen(false);
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-400" />
              Settings
            </h1>
            <p className="text-sm text-slate-400">
              {isAdmin ? 'Company & account settings' : 'Your account settings'}
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-900/30 text-rose-400 border border-rose-500/30'
          }`}>
            {message.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User className="w-4 h-4" />} label="My Profile" />
          {isAdmin && (
            <>
              <TabButton active={activeTab === 'company'} onClick={() => setActiveTab('company')} icon={<Building2 className="w-4 h-4" />} label="Company" />
              <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')} icon={<Users className="w-4 h-4" />} label="Team" />
              <TabButton active={activeTab === 'email'} onClick={() => setActiveTab('email')} icon={<Mail className="w-4 h-4" />} label="Email Settings" />
              <TabButton active={activeTab === 'phone'} onClick={() => setActiveTab('phone')} icon={<Phone className="w-4 h-4" />} label="Phone Numbers" />
            </>
          )}
        </div>

        {/* Content */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">My Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Role</label>
                  <div className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm capitalize flex items-center gap-2 text-slate-300">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    {profile?.role || '—'}
                  </div>
                </div>
              </div>
              <button
                onClick={saveProfile}
                disabled={saving || !fullName.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* COMPANY */}
          {activeTab === 'company' && isAdmin && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Company Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Subscription Status</label>
                  <div className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300">
                    {company?.subscription_status || 'Active'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Wallet Balance</label>
                  <div className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-medium">
                    ${Number(company?.wallet_balance || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Twilio Subaccount</label>
                  <div className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-400 truncate">
                    {company?.twilio_subaccount_sid || 'Not connected'}
                  </div>
                </div>
              </div>
              <button
                onClick={saveCompany}
                disabled={saving || !companyName.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Company'}
              </button>
            </div>
          )}

          {/* TEAM */}
          {activeTab === 'team' && isAdmin && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Team Members</h2>
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Invite Member
                </button>
              </div>

              <div className="space-y-2">
                {team.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">No team members found.</p>
                ) : (
                  team.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-sm">
                          {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {member.full_name || 'Unnamed'}
                            {member.id === profile.id && (
                              <span className="ml-2 text-xs text-indigo-400">(You)</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 capitalize">{member.role}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* EMAIL SETTINGS */}
          {activeTab === 'email' && isAdmin && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Email Settings</h2>
                <p className="text-sm text-slate-400 mt-1">
                  These details will be used when sending emails to claimants from Tessa CRM.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Sender Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Tessa Recovery Team"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Sender Email</label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="e.g. claims@yourcompany.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
                <p className="font-medium text-slate-300 mb-1">Note</p>
                Domain verification and email provider (Resend / SendGrid) will be added later so emails can actually be delivered.
              </div>

              <button
                onClick={saveEmailSettings}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Email Settings'}
              </button>
            </div>
          )}

          {/* PHONE NUMBERS */}
          {activeTab === 'phone' && isAdmin && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Phone Numbers</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Twilio numbers currently connected to this workspace.
                  </p>
                </div>
                <button
                  onClick={() => alert('Phone number purchasing will be available after the wallet system is completed.')}
                  className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buy Number
                </button>
              </div>

              {phoneNumbers.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center">
                  <Phone className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No phone numbers connected yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {phoneNumbers.map((phone) => (
                    <div
                      key={phone.id}
                      className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{phone.phone_number}</p>
                        <p className="text-xs text-slate-400">{phone.friendly_name || 'No friendly name'}</p>
                      </div>
                      <div className="text-xs text-slate-500">
                        {phone.twilio_sid ? 'Connected' : 'Not linked'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========== INVITE MEMBER MODAL ========== */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Invite Team Member</h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-400">
                The person will receive an invitation. After they create an account with this email, you can link them to your company.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
                >
                  <Send className="w-4 h-4" />
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
        active
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
          : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-transparent'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}