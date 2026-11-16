'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  currentBalance: number;
  onBalanceUpdate: (newBalance: number) => void;
}

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
}

interface CompanyNumber {
  id: string;
  phone_number: string;
  friendly_name: string;
  created_at: string;
}

export default function WalletModal({
  isOpen,
  onClose,
  companyId,
  currentBalance,
  onBalanceUpdate
}: WalletModalProps) {
  const [areaCode, setAreaCode] = useState('');
  const [searchResults, setSearchResults] = useState<AvailableNumber[]>([]);
  const [purchasedNumbers, setPurchasedNumbers] = useState<CompanyNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyingNumber, setBuyingNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && companyId) {
      fetchOwnedNumbers();
    }
  }, [isOpen, companyId]);

  // Fetch numbers already owned by this company
  const fetchOwnedNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('company_phone_numbers')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchasedNumbers(data || []);
    } catch (err: any) {
      console.error('Error fetching owned numbers:', err.message);
    }
  };

  // Search Twilio Inventory by Area Code
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (areaCode.length !== 3) {
      setError('Please enter a valid 3-digit area code (e.g., 404, 305, 904).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/twilio/numbers?areaCode=${areaCode}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch numbers.');

      setSearchResults(data.numbers || []);
      if (data.numbers?.length === 0) {
        setError('No available numbers found in this area code.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Purchase Number & Deduct Wallet Balance
  const handleBuyNumber = async (num: AvailableNumber) => {
    setError(null);
    setSuccess(null);
    setBuyingNumber(num.phoneNumber);

    try {
      const res = await fetch('/api/twilio/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          phoneNumber: num.phoneNumber,
          friendlyName: `${num.locality || 'Tessa Line'} (${num.phoneNumber})`
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to purchase number.');

      setSuccess(`Successfully purchased ${num.phoneNumber}!`);
      onBalanceUpdate(data.newWalletBalance);
      setSearchResults(prev => prev.filter(n => n.phoneNumber !== num.phoneNumber));
      fetchOwnedNumbers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBuyingNumber(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl text-white shadow-2xl p-6 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Telecom & Wallet Manager</h2>
            <p className="text-xs text-slate-400">Manage prepaid balances and active outbound lines.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg px-2 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl">
            {success}
          </div>
        )}

        {/* Live Wallet Balance Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-900/50 rounded-xl p-5 mb-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Prepaid Wallet Balance</span>
            <div className="text-3xl font-extrabold text-white mt-1">
              ${Number(currentBalance).toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => alert("Redirecting to Stripe payment gateway integration...")}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl shadow-lg transition"
          >
            + Add Funds
          </button>
        </div>

        {/* Search & Buy Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">Acquire New Phone Number ($2.00/mo)</h3>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              maxLength={3}
              placeholder="Area Code (e.g. 904)"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, ''))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition"
            >
              {loading ? 'Searching...' : 'Search Availability'}
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-3 max-h-48 overflow-y-auto space-y-2 border border-slate-800/80 rounded-xl p-2 bg-slate-950">
              {searchResults.map((num) => (
                <div key={num.phoneNumber} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 transition">
                  <div>
                    <div className="font-mono text-sm text-blue-300">{num.phoneNumber}</div>
                    <div className="text-xs text-slate-500">{num.locality}, {num.region}</div>
                  </div>
                  <button
                    onClick={() => handleBuyNumber(num)}
                    disabled={buyingNumber === num.phoneNumber}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-xs font-semibold rounded-lg text-white transition"
                  >
                    {buyingNumber === num.phoneNumber ? 'Purchasing...' : 'Buy ($2.00)'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Company Lines */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Active Company Phone Lines</h3>
          {purchasedNumbers.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No numbers purchased yet.</p>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {purchasedNumbers.map((num) => (
                <div key={num.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                  <div>
                    <div className="font-mono text-sm font-semibold text-emerald-400">{num.phone_number}</div>
                    <div className="text-xs text-slate-400">{num.friendly_name || 'Active Line'}</div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}