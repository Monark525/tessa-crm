'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, Wallet, Plus, Phone, Search, CreditCard, 
  CheckCircle2, ArrowUpRight, ArrowDownLeft, History 
} from 'lucide-react';

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

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  category: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export default function WalletModal({
  isOpen,
  onClose,
  companyId,
  currentBalance,
  onBalanceUpdate
}: WalletModalProps) {
  const [activeSection, setActiveSection] = useState<'wallet' | 'numbers' | 'history'>('wallet');
  const [areaCode, setAreaCode] = useState('');
  const [searchResults, setSearchResults] = useState<AvailableNumber[]>([]);
  const [purchasedNumbers, setPurchasedNumbers] = useState<CompanyNumber[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyingNumber, setBuyingNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add Funds
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [addingFunds, setAddingFunds] = useState(false);

  useEffect(() => {
    if (isOpen && companyId) {
      fetchOwnedNumbers();
      fetchTransactions();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, companyId]);

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

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error fetching transactions:', err.message);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (areaCode.length !== 3) {
      setError('Please enter a valid 3-digit area code (e.g. 404, 305, 904).');
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
          friendlyName: `\( {num.locality || 'Tessa Line'} ( \){num.phoneNumber})`
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to purchase number.');

      // Log the debit transaction
      const newBalance = data.newWalletBalance;
      await supabase.from('wallet_transactions').insert({
        company_id: companyId,
        type: 'debit',
        category: 'phone_purchase',
        amount: 2.00,
        balance_after: newBalance,
        description: `Purchased phone number ${num.phoneNumber}`,
        reference_id: num.phoneNumber,
      });

      setSuccess(`Successfully purchased ${num.phoneNumber}!`);
      onBalanceUpdate(newBalance);
      setSearchResults(prev => prev.filter(n => n.phoneNumber !== num.phoneNumber));
      fetchOwnedNumbers();
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBuyingNumber(null);
    }
  };

  // ===== ADD FUNDS =====
  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(fundAmount);

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setAddingFunds(true);
    setError(null);

    try {
      const newBalance = Number(currentBalance) + amount;

      // 1. Update company balance
      const { error: updateError } = await supabase
        .from('companies')
        .update({ wallet_balance: newBalance })
        .eq('id', companyId);

      if (updateError) throw updateError;

      // 2. Log the credit transaction
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('wallet_transactions').insert({
        company_id: companyId,
        type: 'credit',
        category: 'topup',
        amount: amount,
        balance_after: newBalance,
        description: `Wallet top-up of \[ {amount.toFixed(2)}`,
        created_by: user?.id,
      });

      onBalanceUpdate(newBalance);
      setSuccess(`Successfully added \]{amount.toFixed(2)} to wallet.`);
      setFundAmount('');
      setShowAddFunds(false);
      fetchTransactions();
    } catch (err: any) {
      setError(err.message || 'Failed to add funds.');
    } finally {
      setAddingFunds(false);
    }
  };

  const formatCategory = (category: string) => {
    const map: Record<string, string> = {
      topup: 'Top-up',
      phone_purchase: 'Phone Number',
      call: 'Call Minutes',
      adjustment: 'Adjustment',
    };
    return map[category] || category;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl text-white shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 p-5 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-400" />
              Wallet & Phone Numbers
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage balance, numbers and transactions</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSection('wallet')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeSection === 'wallet'
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wallet
          </button>
          <button
            onClick={() => setActiveSection('numbers')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeSection === 'numbers'
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Phone Numbers
          </button>
          <button
            onClick={() => setActiveSection('history')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeSection === 'history'
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            History
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}

          {/* ========== WALLET SECTION ========== */}
          {activeSection === 'wallet' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/20 rounded-2xl p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
                  Available Balance
                </p>
                <div className="text-4xl font-bold text-white mb-4">
                  ${Number(currentBalance).toFixed(2)}
                </div>

                {!showAddFunds ? (
                  <button
                    onClick={() => setShowAddFunds(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Funds
                  </button>
                ) : (
                  <form onSubmit={handleAddFunds} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Amount (USD)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        placeholder="e.g. 50.00"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddFunds(false);
                          setFundAmount('');
                        }}
                        className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingFunds || !fundAmount}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
                      >
                        <CreditCard className="w-4 h-4" />
                        {addingFunds ? 'Adding...' : 'Add Funds'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Manual credit for now. Stripe payment gateway will be connected later.
                    </p>
                  </form>
                )}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
                <p className="font-medium text-slate-300 mb-1">How the wallet works</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Funds are used to buy phone numbers and place calls</li>
                  <li>Each phone number costs approximately $2/month</li>
                  <li>Call minutes will be deducted from this balance</li>
                </ul>
              </div>
            </div>
          )}

          {/* ========== PHONE NUMBERS SECTION ========== */}
          {activeSection === 'numbers' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search & Buy Number ($2.00/mo)
                </h3>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="Area Code (e.g. 904)"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, ''))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 flex-1"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </form>
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-800 rounded-xl p-2 bg-slate-950">
                  {searchResults.map((num) => (
                    <div key={num.phoneNumber} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-900 transition">
                      <div>
                        <div className="font-mono text-sm text-indigo-300">{num.phoneNumber}</div>
                        <div className="text-xs text-slate-500">{num.locality}, {num.region}</div>
                      </div>
                      <button
                        onClick={() => handleBuyNumber(num)}
                        disabled={buyingNumber === num.phoneNumber}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-xs font-semibold rounded-lg text-white transition"
                      >
                        {buyingNumber === num.phoneNumber ? 'Buying...' : 'Buy $2'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Your Active Numbers
                </h3>
                {purchasedNumbers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No numbers purchased yet.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {purchasedNumbers.map((num) => (
                      <div key={num.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl">
                        <div>
                          <div className="font-mono text-sm font-semibold text-emerald-400">{num.phone_number}</div>
                          <div className="text-xs text-slate-400">{num.friendly_name || 'Active Line'}</div>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== HISTORY SECTION ========== */}
          {activeSection === 'history' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <History className="w-4 h-4" />
                Transaction History
              </h3>

              {transactions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No transactions yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === 'credit'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}>
                          {tx.type === 'credit' ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {formatCategory(tx.category)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {tx.description}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(tx.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {tx.type === 'credit' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Bal: ${Number(tx.balance_after).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}