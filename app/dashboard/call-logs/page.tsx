'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Phone, ArrowLeft, Clock, User } from 'lucide-react';

export default function CallLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

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

      setCompanyId(profile.company_id);

      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) setLogs(data);
      setLoading(false);
    };

    load();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
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
              <Phone className="w-6 h-6 text-indigo-400" />
              Call Logs
            </h1>
            <p className="text-sm text-slate-400">Recent outbound and inbound calls</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading call logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No call logs yet. Calls you make from a claim will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Date</th>
                    <th className="px-5 py-3.5 font-medium">Phone Number</th>
                    <th className="px-5 py-3.5 font-medium">Direction</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 font-medium">Duration</th>
                    <th className="px-5 py-3.5 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 text-slate-300">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-white">
                        {log.phone_number_dialed || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-1 rounded-md text-xs bg-slate-800 text-slate-300">
                          {log.call_direction || 'Outbound'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {log.call_status || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {log.duration_seconds
                          ? `${Math.floor(log.duration_seconds / 60)}m ${log.duration_seconds % 60}s`
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">
                        {log.agent_notes || '—'}
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