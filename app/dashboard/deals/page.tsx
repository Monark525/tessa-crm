'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { CircleDollarSign, ArrowLeft } from 'lucide-react';

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecovered, setTotalRecovered] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', session.user.id)
        .single();

      if (!profile?.company_id) return;

      let query = supabase
        .from('claims')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('lead_status', 'Closed Won')
        .order('created_at', { ascending: false });

      if (profile.role === 'agent') {
        query = query.eq('assigned_to', session.user.id);
      }

      const { data, error } = await query;

      if (!error && data) {
        setDeals(data);
        const total = data.reduce((sum, d) => sum + (Number(d.excess_funds) || 0), 0);
        setTotalRecovered(total);
      }
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
              <CircleDollarSign className="w-6 h-6 text-emerald-400" />
              Deals / Closed Won
            </h1>
            <p className="text-sm text-slate-400">Successfully closed surplus claims</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Total Recovered (Closed Won)</p>
            <p className="text-3xl font-bold text-emerald-400">
              ${totalRecovered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Closed Deals</p>
            <p className="text-2xl font-bold text-white">{deals.length}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading deals...</div>
          ) : deals.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No closed deals yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Owner</th>
                    <th className="px-5 py-3.5 font-medium">Property</th>
                    <th className="px-5 py-3.5 font-medium">County</th>
                    <th className="px-5 py-3.5 font-medium text-right">Surplus Amount</th>
                    <th className="px-5 py-3.5 font-medium">Closed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr key={deal.id || deal.claims_id} className="border-t border-slate-800 hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-medium text-white">
                        {deal.o1_fname || deal.o1_lname
                          ? `${deal.o1_fname || ''} ${deal.o1_lname || ''}`
                          : 'Unknown Owner'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {deal.prop_address || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {deal.county || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-emerald-400 font-medium text-right">
                        {deal.excess_funds
                          ? `$${Number(deal.excess_funds).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {deal.created_at ? new Date(deal.created_at).toLocaleDateString() : '—'}
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