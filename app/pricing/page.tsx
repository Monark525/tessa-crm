'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Zap, Shield, Crown } from 'lucide-react';

export default function PricingScreen() {
  const router = useRouter();

  const handleSelectPlan = (planName: string) => {
    // In the future, this will connect to Stripe or your payment processor.
    // For now, it completes the onboarding funnel and unlocks the main CRM.
    console.log(`User selected the ${planName} plan.`);
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Select Your CRM Tier</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Your workspace is configured. Choose the plan that best fits your asset recovery volume. You can always upgrade later.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          
          {/* Starter Plan */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col">
            <div className="mb-8">
              <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
                <Shield className="text-blue-400 w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Starter</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-slate-400">/mo</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-grow text-slate-300">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Up to 500 active claims</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Basic CSV Import</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> 1 Team Member</li>
            </ul>
            <button 
              onClick={() => handleSelectPlan('Starter')}
              className="w-full py-3 px-4 rounded-xl font-bold border border-blue-500 text-blue-400 hover:bg-blue-950/50 transition-colors"
            >
              Select Starter
            </button>
          </div>

          {/* Pro Plan (Highlighted) */}
          <div className="bg-slate-900 border border-indigo-500 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-indigo-900/20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">
              MOST POPULAR
            </div>
            <div className="mb-8">
              <div className="w-12 h-12 bg-indigo-900/50 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/30">
                <Zap className="text-indigo-400 w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Professional</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$129</span>
                <span className="text-slate-400">/mo</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-grow text-slate-300">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" /> Unlimited claims</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" /> Advanced CSV Mapping Engine</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" /> Up to 5 Team Members</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" /> Twilio Voice/SMS Integration</li>
            </ul>
            <button 
              onClick={() => handleSelectPlan('Professional')}
              className="w-full py-3 px-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              Select Professional
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col">
            <div className="mb-8">
              <div className="w-12 h-12 bg-purple-900/50 rounded-xl flex items-center justify-center mb-4 border border-purple-500/30">
                <Crown className="text-purple-400 w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Enterprise</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$299</span>
                <span className="text-slate-400">/mo</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-grow text-slate-300">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> Everything in Pro</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> Unlimited Team Members</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> Custom Supabase Storage</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> Priority Support</li>
            </ul>
            <button 
              onClick={() => handleSelectPlan('Enterprise')}
              className="w-full py-3 px-4 rounded-xl font-bold border border-purple-500 text-purple-400 hover:bg-purple-950/50 transition-colors"
            >
              Select Enterprise
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}