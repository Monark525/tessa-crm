'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Mail, ArrowLeft } from 'lucide-react';

export default function EmailLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .single();

      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (!error && data) setLogs(data);
      setLoading(false);
    };

    load();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="w-6 h-6 text-indigo-400" />
              Email Logs
            </h1>
            <p className="text-sm text-slate-400">History of emails sent from Tessa CRM</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading email logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No emails sent yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Date</th>
                    <th className="px-5 py-3.5 font-medium">Recipient</th>
                    <th className="px-5 py-3.5 font-medium">Subject</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 text-slate-300">
                        {log.sent_at ? new Date(log.sent_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-white">
                        {log.recipient_email || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 max-w-xs truncate">
                        {log.subject_line || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          log.email_status === 'Sent' || log.email_status === 'Delivered'
                            ? 'bg-emerald-900/40 text-emerald-400'
                            : log.email_status === 'Failed'
                            ? 'bg-rose-900/40 text-rose-400'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {log.email_status || 'Queued'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}