'use client';

import WalletModal from './WalletModal';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import {
  LogOut, ShieldCheck, Search, Database, FileSpreadsheet, Building2,
  CircleDollarSign, X, Phone, PhoneCall, Mail, User, MapPin, MessageSquare,
  Send, Clock, Tag, Users, Menu, LayoutDashboard, PhoneCall as PhoneIcon,
  Mail as MailIcon, Settings, Wallet, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import { Device } from '@twilio/voice-sdk';

const STATUS_OPTIONS = [
  { label: 'New Lead', color: 'bg-indigo-900/40 text-indigo-400 border-indigo-500/30' },
  { label: 'Contacted', color: 'bg-blue-900/40 text-blue-400 border-blue-500/30' },
  { label: 'In Negotiation', color: 'bg-amber-900/40 text-amber-400 border-amber-500/30' },
  { label: 'Under Contract', color: 'bg-purple-900/40 text-purple-400 border-purple-500/30' },
  { label: 'Closed Won', color: 'bg-emerald-900/40 text-emerald-400 border-emerald-500/30' },
  { label: 'Closed Lost', color: 'bg-red-900/40 text-red-400 border-red-500/30' }
];

const FILTER_TABS = ['All', 'New Lead', 'Contacted', 'In Negotiation', 'Under Contract', 'Closed Won', 'Closed Lost'];

export default function Dashboard() {
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [claims, setClaims] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isFetchingNotes, setIsFetchingNotes] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0.00);
  const [companyId, setCompanyId] = useState('');
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Selection & Delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Call Modal
const [isCallModalOpen, setIsCallModalOpen] = useState(false);
const [callPhone, setCallPhone] = useState('');
const [callStatus, setCallStatus] = useState<'Idle' | 'Connecting' | 'In Call' | 'Ended'>('Idle');
const [activeCall, setActiveCall] = useState<any>(null);
const [callSeconds, setCallSeconds] = useState(0);
const [callScript, setCallScript] = useState(`...`);
const [callNote, setCallNote] = useState('');
const timerRef = useRef<NodeJS.Timeout | null>(null);

// ===== ADD THESE NEW EMAIL STATES =====
const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
const [emailTo, setEmailTo] = useState('');
const [emailSubject, setEmailSubject] = useState('');
const [emailBody, setEmailBody] = useState('');
const [emailType, setEmailType] = useState<'owner' | 'relative'>('owner');
const [emailRecipientName, setEmailRecipientName] = useState('');
const [isSendingEmail, setIsSendingEmail] = useState(false);
const [callContactName, setCallContactName] = useState('');
const [callContactRole, setCallContactRole] = useState('');

  useEffect(() => {
    async function loadCompanyData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (userProfile?.company_id) {
          setCompanyId(userProfile.company_id);
          const { data: company } = await supabase
            .from('companies')
            .select('wallet_balance')
            .eq('id', userProfile.company_id)
            .single();

          if (company) setWalletBalance(Number(company.wallet_balance) || 0);
        }
      }
    }
    loadCompanyData();
  }, []);

  useEffect(() => {
    const authenticateAndFetchData = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) return router.push('/login');

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`id, full_name, role, company_id, companies (company_name)`)
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        setProfile(profileData);
        if (profileData.companies) {
          // @ts-ignore
          setCompanyName(profileData.companies.company_name || 'Unknown Company');
        }

        let claimsQuery = supabase
          .from('claims')
          .select('*')
          .eq('company_id', profileData.company_id)
          .order('created_at', { ascending: false });

        if (profileData.role === 'agent') {
          claimsQuery = claimsQuery.eq('assigned_to', session.user.id);
        }

        const { data: claimsData, error: claimsError } = await claimsQuery;
        if (claimsError) throw claimsError;
        if (claimsData) setClaims(claimsData);

        if (profileData.role !== 'agent') {
          const { data: teamData } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('company_id', profileData.company_id);

          if (teamData) setTeamMembers(teamData);
        }
      } catch (error: any) {
        console.error('Dashboard Error:', error.message);
      } finally {
        setLoading(false);
      }
    };
    authenticateAndFetchData();
  }, [router]);

  useEffect(() => {
    if (selectedClaim?.id) fetchNotesForClaim(selectedClaim.id);
    else setNotes([]);
  }, [selectedClaim]);

  // Call timer
  useEffect(() => {
    if (callStatus === 'In Call') {
      timerRef.current = setInterval(() => {
        setCallSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const fetchNotesForClaim = async (claimId: string) => {
    setIsFetchingNotes(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: false });
    if (!error && data) setNotes(data);
    setIsFetchingNotes(false);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedClaim?.id) return;
    setIsSavingNote(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from('notes').insert({
        claim_id: selectedClaim.id,
        company_id: profile.company_id,
        author_id: session?.user?.id,
        note_text: newNoteText.trim()
      });
      if (error) throw error;
      setNewNoteText('');
      fetchNotesForClaim(selectedClaim.id);
    } catch (err: any) {
      console.error('Failed to add note:', err.message);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedClaim?.id) return;
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase.from('claims').update({ lead_status: newStatus }).eq('id', selectedClaim.id);
      if (error) throw error;
      setSelectedClaim({ ...selectedClaim, lead_status: newStatus });
      setClaims(claims.map(c => c.id === selectedClaim.id ? { ...c, lead_status: newStatus } : c));
    } catch (err: any) {
      console.error('Failed to update status:', err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignLead = async (agentId: string) => {
    if (!selectedClaim?.id) return;
    setIsAssigning(true);
    const assignedValue = agentId === 'unassigned' ? null : agentId;
    try {
      const { error } = await supabase.from('claims').update({ assigned_to: assignedValue }).eq('id', selectedClaim.id);
      if (error) throw error;
      setSelectedClaim({ ...selectedClaim, assigned_to: assignedValue });
      setClaims(claims.map(c => c.id === selectedClaim.id ? { ...c, assigned_to: assignedValue } : c));
    } catch (err: any) {
      console.error('Failed to assign lead:', err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredClaims.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredClaims.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const openDeleteConfirm = (ids: string[]) => {
    setIdsToDelete(ids);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (idsToDelete.length === 0) return;
    setIsDeleting(true);

    try {
      await supabase.from('notes').delete().in('claim_id', idsToDelete);
      await supabase.from('contacts').delete().in('claim_id', idsToDelete);

      const { error } = await supabase.from('claims').delete().in('id', idsToDelete);
      if (error) throw error;

      setClaims(prev => prev.filter(c => !idsToDelete.includes(c.id)));
      setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));

      if (selectedClaim && idsToDelete.includes(selectedClaim.id)) {
        setSelectedClaim(null);
      }

      setIsDeleteConfirmOpen(false);
      setIdsToDelete([]);
    } catch (err: any) {
      console.error('Delete failed:', err.message);
      alert('Failed to delete: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // ===== CALL LOGIC =====
  const openCallModal = (
  phone: string,
  claim: any,
  contactName?: string,
  contactRole?: string
) => {
  setCallPhone(phone);
  setSelectedClaim(claim);
  setCallStatus('Idle');
  setCallSeconds(0);
  setCallNote('');
  setCallContactName(contactName || '');
  setCallContactRole(contactRole || '');

  const ownerName = `${claim.o1_fname || ''} ${claim.o1_lname || ''}`.trim() || 'the owner';
  const propertyAddress = claim.prop_address || 'the property';
  const county = claim.county || '';

  const dynamicScript = `Hi, I'm calling about your former property at ${propertyAddress}${county ? ` in ${county}` : ''}. Are you aware of the payout cheque that belongs to you from the sale of this property?

Ok I need to verify, am I speaking with ${contactName || ownerName}? Or are you somehow related to them or know how to get in touch with them?

Ok great! I'm David from Tessa Holdings Group. When your property was sold, it generated surplus proceeds — a payout cheque that goes to you after liens are paid off. Tessa Holdings helps you file a claim for it with zero upfront cost or risk to you because we handle all the fees, paperwork, and notary costs. This costs you absolutely $0 — meaning we don't get paid if we can't get you your money.

I'd like to send you more details with proof of the amount owed to you along with our company's information. Can I get your email address to do this?

OK got it!

────────────────────────
VOICEMAIL SCRIPT:
Hi, I'm calling about your former property at ${propertyAddress}${county ? ` in ${county}` : ''} to notify you about the payout cheque that belongs to you from the sale of this property. If this is ${contactName || ownerName}, the previous owner of this property, or you are somehow related to them, please give me a callback at (601) 685-4303 or text me at (704) 444-0874 for more details. Please pass this message on to them to contact me. My name is David calling from Tessa Holdings Group. Thank you.`;

  setCallScript(dynamicScript);
  setIsCallModalOpen(true);
};
const openEmailModal = (
  email: string,
  claim: any,
  type: 'owner' | 'relative',
  recipientName?: string
) => {
  setEmailTo(email);
  setEmailType(type);
  setEmailRecipientName(recipientName || '');
  setSelectedClaim(claim);

  const ownerName = `${claim.o1_fname || ''} ${claim.o1_lname || ''}`.trim() || 'the owner';
  const fullAddress = [
    claim.prop_address,
    claim.prop_city,
    claim.prop_state,
    claim.prop_zip
  ].filter(Boolean).join(', ') || 'the property';
  const county = claim.county || '';

  if (type === 'owner') {
    setEmailSubject(`Audited Property File for "${fullAddress}" In "${county}"`);
    setEmailBody(`Hi, this email is for the former owner of "${fullAddress}" located in ${county}.

I hope this message finds you well. I am reaching out regarding a positive financial matter connected to your former property.

My firm, Tessa Holdings Group LLC, recently conducted an audit of property records and uncovered a substantial surplus balance that may be due to you.
When property files are closed, surplus funds are often left behind; If they are not claimed within a specific window, they are permanently absorbed by government agencies.

We specialize in helping individuals legally recover these funds. We handle 100% of the research, paperwork, and all legal compliance fees with *zero risk or upfront cost to you*. We only get paid a percentage if and when we successfully recover your funds. If we don't recover anything, you owe us absolutely nothing.

I would love to schedule a brief, 5-minute call to share the details of our audit with you. You can reply directly to this email or give me a call back at (601) 685-4303 or text me at (704) 444-0874.

Warm regards,

Tessa Holdings Group LLC
(601) 685-4303
(704) 444-0874
TessaHoldingsGroup@outlook.com
www.tessaholdingsgroup.com`);
  } else {
    setEmailSubject(`Contact Request Regarding "${ownerName}"`);
    setEmailBody(`Sir/Madam,

I am a payment distribution agent for TESSA HOLDINGS GROUP, LLC. Your name came up as a potential relative/associate of "${ownerName}".

Our company is trying to contact them regarding a payout cheque that belongs to them from a property they own or owned in ${county}. The county has sent notices to them at the address(es) they have on file, yet they have been returned.

If you have a way to reach them, please forward this email to them or have them give us a call at (601) 685-4303 or text us at (704) 444-0874. If you have any questions, please contact us or visit our website at www.tessaholdingsgroup.com.

Tessa Holdings Group LLC
(601) 685-4303
(704) 444-0874
TessaHoldingsGroup@outlook.com
www.tessaholdingsgroup.com`);
  }

  setIsEmailModalOpen(true);
};

const sendEmail = async () => {
  if (!emailTo || !emailSubject || !emailBody) return;
  setIsSendingEmail(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: emailTo,
        subject: emailSubject,
        html: emailBody,
        companyId: profile?.company_id,
        claimId: selectedClaim?.id,
        emailType: emailType,
        recipientName: emailRecipientName,
        sentBy: session?.user?.id
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send email');

    alert('Email sent successfully!');
    setIsEmailModalOpen(false);
  } catch (err: any) {
    console.error(err);
    alert('Failed to send email: ' + err.message);
  } finally {
    setIsSendingEmail(false);
  }
};

  const startCall = async () => {
    try {
      setCallStatus('Connecting');
      const cleanDigits = callPhone.replace(/\D/g, '');
      const formattedNumber = cleanDigits.startsWith('1') ? `+${cleanDigits}` : `+1${cleanDigits}`;

      const response = await fetch('/api/twilio/token');
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const device = new Device(data.token);
      const call = await device.connect({ params: { To: formattedNumber } });

      call.on('accept', () => setCallStatus('In Call'));
      call.on('disconnect', () => {
        setCallStatus('Ended');
        setActiveCall(null);
      });
      call.on('error', (error: any) => {
        console.error('Twilio Error:', error);
        setCallStatus('Idle');
        alert(`Call failed: ${error.message}`);
      });

      setActiveCall(call);
    } catch (error: any) {
      console.error('Setup Error:', error);
      setCallStatus('Idle');
      alert(`Could not start call: ${error.message}`);
    }
  };

const endCall = () => {
  if (activeCall) {
    activeCall.disconnect();
  }
  setCallStatus('Ended');
};

const closeCallModal = async () => {
  if (activeCall) {
    activeCall.disconnect();
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();

    // Save Call Log
    if (callPhone && profile?.company_id) {
      await supabase.from('call_logs').insert({
        company_id: profile.company_id,
        agent_id: session?.user?.id || null,
        phone_number_dialed: callPhone,
        call_direction: 'Outbound',
        call_status: callSeconds > 0 ? 'Completed' : 'No Answer',
        duration_seconds: callSeconds || 0,
        billed_minutes: Math.ceil((callSeconds || 0) / 60),
        agent_notes: callNote.trim() || null,
      });
    }

    // Save Note
    if (callNote.trim() && selectedClaim?.id) {
      await supabase.from('notes').insert({
        claim_id: selectedClaim.id,
        company_id: profile?.company_id,
        author_id: session?.user?.id,
        note_text: `[Call ${callPhone}] ${callNote.trim()}`
      });
      fetchNotesForClaim(selectedClaim.id);
    }
  } catch (err) {
    console.error('Error saving call data:', err);
  }

  // Reset modal
  setIsCallModalOpen(false);
  setCallStatus('Idle');
  setCallSeconds(0);
  setActiveCall(null);
  setCallNote('');
};

  const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

  const filteredClaims = claims.filter(c => {
    const matchesSearch =
      (c.o1_fname?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (c.o1_lname?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (c.prop_address?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (c.county?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (c.lead_status?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const currentStatus = c.lead_status || 'New Lead';
    const matchesTab = activeFilter === 'All' || currentStatus === activeFilter;
    return matchesSearch && matchesTab;
  });

  const totalSurplus = claims.reduce((acc, curr) => acc + (Number(curr.excess_funds) || 0), 0);
  const isAdmin = profile?.role !== 'agent';
  const allSelected = filteredClaims.length > 0 && selectedIds.length === filteredClaims.length;

  const getStatusColor = (statusName: string) => {
    const match = STATUS_OPTIONS.find(s => s.label.toLowerCase() === (statusName || '').toLowerCase());
    return match ? match.color : 'bg-slate-800 text-slate-400 border-slate-700';
  };

  const renderPersonBlock = (prefix: string, label: string, claim: any) => {
  const fname = claim[`${prefix}_fname`];
  const lname = claim[`${prefix}_lname`];
  const phones = claim[`${prefix}_phones`];
  const emails = claim[`${prefix}_emails`];

  if (!fname && !lname && !phones && !emails) return null;

  const fullName = `${fname || ''} ${lname || ''}`.trim();
  const isOwner = prefix.startsWith('o');
  const roleLabel = isOwner ? 'Owner' : label;

  return (
    <div key={prefix} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
      <p className="text-xs font-semibold text-indigo-400 mb-3 flex items-center gap-1.5">
        <User className="w-3.5 h-3.5" /> {label}
        {fullName && (
          <span className="text-slate-300 font-medium ml-1">— {fullName}</span>
        )}
      </p>

      {phones ? (
        <div className="flex flex-col gap-2 mb-3">
          {phones.split(',').map((phoneStr: string, idx: number) => {
            const phone = phoneStr.trim();
            if (!phone) return null;
            return (
              <div key={idx} className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-sm font-medium text-slate-200">{phone}</span>
                <button
                  onClick={() => openCallModal(phone, claim, fullName, isOwner ? '' : roleLabel)}
                  className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Dial
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 italic mb-2">No phones</p>
      )}

      {emails ? (
        <div className="flex flex-col gap-2">
          {emails.split(',').map((emailStr: string, idx: number) => {
            const email = emailStr.trim();
            if (!email) return null;
            return (
              <div key={idx} className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-sm font-medium text-slate-200 truncate max-w-[180px]">{email}</span>
                <button
                  onClick={() => openEmailModal(email, claim, isOwner ? 'owner' : 'relative', fullName)}
                  className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 italic">No emails recorded</p>
      )}
    </div>
  );
};

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading Tessa CRM...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out fixed h-full z-40`}>
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-white truncate">{companyName || 'Company'}</p>
                <p className="text-xs text-slate-400 capitalize">{profile?.role || 'User'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <SidebarItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active open={sidebarOpen} onClick={() => {}} />
          <SidebarItem icon={<PhoneIcon className="w-5 h-5" />} label="Call Logs" open={sidebarOpen} onClick={() => router.push('/dashboard/call-logs')} />
          <SidebarItem icon={<MailIcon className="w-5 h-5" />} label="Email Logs" open={sidebarOpen} onClick={() => router.push('/dashboard/email-logs')} />
          <SidebarItem icon={<CircleDollarSign className="w-5 h-5" />} label="Deals / Closed Won" open={sidebarOpen} onClick={() => router.push('/dashboard/deals')} />
          {isAdmin && (
            <>
              <SidebarItem icon={<Wallet className="w-5 h-5" />} label="Wallet" open={sidebarOpen} onClick={() => setIsWalletOpen(true)} />
              <SidebarItem icon={<Settings className="w-5 h-5" />} label="Settings" open={sidebarOpen} onClick={() => router.push('/dashboard/settings')} />
            </>
          )}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <SidebarItem icon={<LogOut className="w-5 h-5" />} label="Sign Out" open={sidebarOpen} onClick={() => setIsSignOutModalOpen(true)} danger />
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 bg-slate-800 border border-slate-700 rounded-full p-1 text-slate-400 hover:text-white"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
              </div>
            </div>
          </div>

          <h1 className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2 hidden md:block">
            {companyName}
          </h1>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/30 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-300">Tessa CRM</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <StatCard icon={<Database className="w-5 h-5" />} label="Total Database Records" value={claims.length} color="indigo" />
              <StatCard
                icon={<CircleDollarSign className="w-5 h-5" />}
                label="Total Identified Surplus"
                value={'$' + totalSurplus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                color="emerald"
              />
              <StatCard icon={<Building2 className="w-5 h-5" />} label="Active Workspace" value={companyName} color="amber" />
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[calc(100vh-220px)] overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-white">
                  {isAdmin ? 'Active Claims Directory' : 'My Assigned Leads'}
                </h2>

                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5">
                    <span className="text-xs text-slate-300 font-medium">
                      {selectedIds.length} selected
                    </span>
                    <button
                      onClick={() => openDeleteConfirm(selectedIds)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {isAdmin && (
                  <button
                    onClick={() => router.push('/dashboard/import')}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Import
                  </button>
                )}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search owner, address, county..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 w-full"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-b border-slate-800 flex gap-2 overflow-x-auto">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    activeFilter === tab
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-4 py-3.5 font-medium">Status</th>
                    <th className="px-4 py-3.5 font-medium">Owner Name</th>
                    <th className="px-4 py-3.5 font-medium">Property Address</th>
                    <th className="px-4 py-3.5 font-medium">County</th>
                    <th className="px-4 py-3.5 font-medium">Auction Date</th>
                    <th className="px-4 py-3.5 font-medium text-right">Surplus</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        No claims found.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim) => (
                      <tr
                        key={claim.id}
                        onClick={() => setSelectedClaim(claim)}
                        className={`border-t border-slate-800 hover:bg-slate-800/50 cursor-pointer transition ${
                          selectedIds.includes(claim.id) ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(claim.id)}
                            onChange={() => toggleSelectOne(claim.id)}
                            className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(claim.lead_status || 'New Lead')}`}>
                            {claim.lead_status || 'New Lead'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-white">
                          {claim.o1_fname || claim.o1_lname
                            ? `${claim.o1_fname || ''} ${claim.o1_lname || ''}`.trim()
                            : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300 max-w-[180px] truncate">
                          {claim.prop_address || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">
                          {claim.county || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">
                          {claim.auction_date
                            ? new Date(claim.auction_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-emerald-400">
                          {claim.excess_funds
                            ? '$' + Number(claim.excess_funds).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* CLAIM DETAIL MODAL */}
      {selectedClaim && !isCallModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedClaim.o1_fname || ''} {selectedClaim.o1_lname || ''}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedClaim.county} {selectedClaim.case_number ? `• Case #${selectedClaim.case_number}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openDeleteConfirm([selectedClaim.id])}
                  className="text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-indigo-400" /> Status
                </span>
                <select
                  value={selectedClaim.lead_status || 'New Lead'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdatingStatus}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.label} value={opt.label}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" /> Assign To
                  </span>
                  <select
                    value={selectedClaim.assigned_to || 'unassigned'}
                    onChange={(e) => handleAssignLead(e.target.value)}
                    disabled={isAssigning}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="unassigned">— Unassigned —</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.full_name || 'Unnamed Agent'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Full Property Address
                </p>
                <p className="text-sm text-slate-200">
                  {[
                    selectedClaim.prop_address,
                    selectedClaim.prop_city,
                    selectedClaim.prop_state,
                    selectedClaim.prop_zip,
                  ].filter(Boolean).join(', ') || 'No address listed'}
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Auction Date
                </p>
                <p className="text-sm font-medium text-amber-400">
                  {selectedClaim.auction_date
                    ? new Date(selectedClaim.auction_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Not Scheduled'}
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                  <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" /> Excess Funds
                </p>
                <p className="text-sm font-bold text-emerald-400">
                  {selectedClaim.excess_funds
                    ? '$' + Number(selectedClaim.excess_funds).toLocaleString()
                    : '$0.00'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400" /> Contact Information
              </h3>

              {renderPersonBlock('o1', 'Owner', selectedClaim)}
              {renderPersonBlock('o2', 'Owner 2', selectedClaim)}
              {renderPersonBlock('r1', 'Relative 1', selectedClaim)}
              {renderPersonBlock('r2', 'Relative 2', selectedClaim)}
              {renderPersonBlock('r3', 'Relative 3', selectedClaim)}
              {renderPersonBlock('r4', 'Relative 4', selectedClaim)}
              {renderPersonBlock('r5', 'Relative 5', selectedClaim)}

              {/* Relative 6+ and Associates */}
              {selectedClaim.custom_fields && typeof selectedClaim.custom_fields === 'object' && (() => {
                type ContactEntry = {
                  index: number;
                  fname: string;
                  lname: string;
                  fullName: string;
                  phones: { order: number; value: string }[];
                  emails: { order: number; value: string }[];
                };

                const relativesMap = new Map<number, ContactEntry>();
                const associatesMap = new Map<number, ContactEntry>();

                const getOrCreate = (map: Map<number, ContactEntry>, index: number): ContactEntry => {
                  if (!map.has(index)) {
                    map.set(index, {
                      index,
                      fname: '',
                      lname: '',
                      fullName: '',
                      phones: [],
                      emails: [],
                    });
                  }
                  return map.get(index)!;
                };

                Object.entries(selectedClaim.custom_fields).forEach(([rawKey, rawVal]) => {
                  if (rawVal === null || rawVal === undefined) return;
                  const valStr = String(rawVal).trim();
                  if (!valStr) return;

                  const normKey = rawKey.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

                  const relMatch = normKey.match(/^(?:custom\s+)?(?:relative\s+|r)(\d+)\s*(.*)$/i);
                  const assocMatch = !relMatch ? normKey.match(/^(?:custom\s+)?(?:associate\s+|a)(\d+)\s*(.*)$/i) : null;

                  const match = relMatch || assocMatch;
                  if (!match) return;

                  const isRelative = Boolean(relMatch);
                  const personIndex = parseInt(match[1], 10);

                  if (isRelative && personIndex <= 5) return;

                  const remainder = (match[2] || '').trim();
                  const targetMap = isRelative ? relativesMap : associatesMap;
                  const entry = getOrCreate(targetMap, personIndex);

                  if (/^(first\s*name|fname)$/i.test(remainder)) {
                    entry.fname = valStr;
                    return;
                  }
                  if (/^(last\s*name|lname)$/i.test(remainder)) {
                    entry.lname = valStr;
                    return;
                  }
                  if (/^(full\s*name|name)$/i.test(remainder)) {
                    entry.fullName = valStr;
                    return;
                  }

                  if (/\b(phone|mobile|cell|tel)\b/i.test(remainder) && !/\b(type|status|carrier|line|score|dnc)\b/i.test(remainder)) {
                    const orderMatch = remainder.match(/(\d+)/);
                    const order = orderMatch ? parseInt(orderMatch[1], 10) : 999;

                    valStr.split(',').forEach((part) => {
                      const trimmed = part.trim();
                      const digits = trimmed.replace(/\D/g, '');
                      if (digits.length >= 7 && digits.length <= 15 && !/[a-zA-Z]/.test(trimmed)) {
                        entry.phones.push({ order, value: trimmed });
                      }
                    });
                    return;
                  }

                  if (/\bemail\b/i.test(remainder)) {
                    const orderMatch = remainder.match(/(\d+)/);
                    const order = orderMatch ? parseInt(orderMatch[1], 10) : 999;

                    valStr.split(',').forEach((part) => {
                      const trimmed = part.trim();
                      if (trimmed.includes('@') && /\S+@\S+\.\S+/.test(trimmed)) {
                        entry.emails.push({ order, value: trimmed });
                      }
                    });
                  }
                });

                const buildCards = (map: Map<number, ContactEntry>, roleLabel: string) => {
  return Array.from(map.values())
    .sort((a, b) => a.index - b.index)
    .map((person) => {
      const sortedPhones: string[] = [];
      person.phones
        .sort((a, b) => a.order - b.order)
        .forEach((p) => {
          if (!sortedPhones.includes(p.value)) sortedPhones.push(p.value);
        });

      const sortedEmails: string[] = [];
      person.emails
        .sort((a, b) => a.order - b.order)
        .forEach((e) => {
          if (!sortedEmails.includes(e.value)) sortedEmails.push(e.value);
        });

      if (
        sortedPhones.length === 0 &&
        sortedEmails.length === 0 &&
        !person.fname &&
        !person.lname &&
        !person.fullName
      ) {
        return null;
      }

      const displayName =
        person.fullName || [person.fname, person.lname].filter(Boolean).join(' ');

      return (
        <div
          key={`${roleLabel}-${person.index}`}
          className="bg-slate-950 p-4 rounded-xl border border-slate-800"
        >
          <p className="text-xs font-semibold text-indigo-400 mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> {roleLabel} {person.index}
            {displayName && (
              <span className="text-slate-300 font-medium ml-1">— {displayName}</span>
            )}
          </p>

          {/* Phones */}
          {sortedPhones.length > 0 ? (
            <div className="flex flex-col gap-2 mb-3">
              {sortedPhones.map((phone, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800"
                >
                  <span className="text-sm font-medium text-slate-200">{phone}</span>
                  <button
                    onClick={() =>
                      openCallModal(phone, selectedClaim, displayName, roleLabel)
                    }
                    className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Dial
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic mb-2">No phones</p>
          )}

          {/* Emails */}
          {sortedEmails.length > 0 ? (
            <div className="flex flex-col gap-2">
              {sortedEmails.map((email, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800"
                >
                  <span className="text-sm font-medium text-slate-200 truncate max-w-[180px]">
                    {email}
                  </span>
                  <button
                    onClick={() =>
                      openEmailModal(email, selectedClaim, 'relative', displayName)
                    }
                    className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No emails recorded</p>
          )}
        </div>
      );
    });
};

                return (
                  <>
                    {buildCards(relativesMap, 'Relative')}
                    {buildCards(associatesMap, 'Associate')}
                  </>
                );
              })()}
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" /> Call Notes & Activity History
              </h3>
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Log a call result, email sent, or note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSavingNote || !newNoteText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSavingNote ? 'Saving...' : 'Log Note'}
                </button>
              </form>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {isFetchingNotes ? (
                  <p className="text-xs text-slate-500 text-center py-4">Loading activity...</p>
                ) : notes.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No activity logged yet.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.note_id || note.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs flex flex-col gap-1">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-medium text-indigo-300">Agent Note</span>
                        <span className="flex items-center gap-1 text-[10px]">
                          <Clock className="w-3 h-3" />
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-200 text-sm">{note.note_text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALL MODAL */}
      {isCallModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-start justify-between">
  <div>
    <h2 className="text-lg font-bold text-white">
      {callContactName
        ? `${callContactName}${callContactRole ? ` (${callContactRole} of ${selectedClaim.o1_fname} ${selectedClaim.o1_lname})` : ''}`
        : `${selectedClaim.o1_fname} ${selectedClaim.o1_lname}`}
    </h2>
    <p className="text-sm text-slate-400 mt-0.5">{callPhone}</p>
    <p className="text-xs text-slate-500 mt-1">
      {selectedClaim.prop_address} • {selectedClaim.county}
    </p>
  </div>
  <button onClick={closeCallModal} className="text-slate-400 hover:text-white p-2">
    <X className="w-5 h-5" />
  </button>
</div>

            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`text-2xl font-mono font-bold ${callStatus === 'In Call' ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {formatTime(callSeconds)}
                </div>
                <div className="text-sm">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    callStatus === 'In Call' ? 'bg-emerald-900/40 text-emerald-400' :
                    callStatus === 'Connecting' ? 'bg-amber-900/40 text-amber-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {callStatus}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {callStatus === 'Idle' || callStatus === 'Ended' ? (
                  <button
                    onClick={startCall}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Start Call
                  </button>
                ) : (
                  <button
                    onClick={endCall}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
                  >
                    End Call
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 border-b border-slate-800">
              <label className="text-xs font-semibold text-slate-400 mb-2 block">Call Script</label>
              <textarea
                value={callScript}
                onChange={(e) => setCallScript(e.target.value)}
                rows={25}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="p-5">
              <label className="text-xs font-semibold text-slate-400 mb-2 block">Call Notes</label>
              <textarea
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
                placeholder="Type notes during or after the call..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                Notes will be automatically saved when you close this window.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* EMAIL MODAL */}
{isEmailModalOpen && selectedClaim && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
      <div className="p-5 border-b border-slate-800 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">
            Send Email – {emailType === 'owner' ? 'Owner' : 'Relative / Associate'}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">{emailTo}</p>
          {emailRecipientName && (
            <p className="text-xs text-slate-500 mt-1">{emailRecipientName}</p>
          )}
        </div>
        <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-white p-2">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Subject</label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email Body</label>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={16}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setIsEmailModalOpen(false)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={sendEmail}
            disabled={isSendingEmail}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
          >
            <Send className="w-4 h-4" />
            {isSendingEmail ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* DELETE CONFIRMATION */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-rose-500/15 p-3 rounded-xl text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Claim{idsToDelete.length > 1 ? 's' : ''}</h3>
                <p className="text-sm text-slate-400">
                  {idsToDelete.length === 1
                    ? 'This claim will be permanently deleted.'
                    : `${idsToDelete.length} claims will be permanently deleted.`}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-6">
              This action cannot be undone. Are you sure you want to continue?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setIdsToDelete([]);
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        companyId={companyId}
        currentBalance={walletBalance}
        onBalanceUpdate={(newBalance) => setWalletBalance(newBalance)}
      />

      {isSignOutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-white mb-2">Sign Out</h3>
            <p className="text-sm text-slate-400 mb-6">Are you sure you want to sign out of Tessa CRM?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsSignOutModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({
  icon, label, active = false, open, onClick, danger = false
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  open: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={!open ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
          : danger
          ? 'text-rose-400 hover:bg-rose-500/10'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {open && <span className="truncate">{label}</span>}
    </button>
  );
}

function StatCard({
  icon, label, value, color
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'indigo' | 'emerald' | 'amber';
}) {
  const colors = {
    indigo: 'bg-indigo-900/40 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-900/40 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-900/40 text-amber-400 border-amber-500/20'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl border ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
}