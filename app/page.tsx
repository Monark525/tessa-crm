'use client';

import Link from 'next/link';
import { 
  ShieldCheck, Database, Phone, Mail, FileSpreadsheet, 
  CircleDollarSign, Users, ArrowRight, CheckCircle2, 
  Zap, Lock, BarChart3
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      
      {/* ========== NAVBAR ========== */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600/20 p-1.5 rounded-lg border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="font-bold text-lg tracking-tight">Tessa CRM</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-lg transition"
            >
              Login
            </Link>
            <Link
              href="/onboarding"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl transition shadow-lg shadow-indigo-600/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ========== HERO ========== */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-500/20 text-indigo-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5" />
          Built for Surplus Funds & Asset Recovery Teams
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight max-w-4xl mx-auto">
          The Operating System for{' '}
          <span className="text-indigo-400">Surplus Recovery</span> Companies
        </h1>

        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Stop managing claims in spreadsheets. Tessa CRM gives your team one powerful place 
          to import leads, contact owners, track negotiations, and close deals — with built-in calling and email.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/25"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-8 py-3.5 rounded-xl border border-slate-700 transition"
          >
            Login to your workspace
          </Link>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white">Everything your recovery team needs</h2>
          <p className="mt-3 text-slate-400">From first import to final recovery — all in one platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<FileSpreadsheet className="w-5 h-5" />}
            title="Smart CSV Import"
            description="Map any county export in minutes. Support for multiple owners, relatives, phones, and emails."
          />
          <FeatureCard
            icon={<Phone className="w-5 h-5" />}
            title="Built-in Calling"
            description="Click-to-call directly from any claim. Every conversation is logged against the right record."
          />
          <FeatureCard
            icon={<Mail className="w-5 h-5" />}
            title="Email Outreach"
            description="Send professional emails to claimants and keep a full history of every message."
          />
          <FeatureCard
            icon={<Database className="w-5 h-5" />}
            title="Centralized Pipeline"
            description="Track every claim from New Lead → Contacted → Under Contract → Closed Won."
          />
          <FeatureCard
            icon={<Users className="w-5 h-5" />}
            title="Team & Roles"
            description="Admins control the workspace. Agents only see the leads assigned to them."
          />
          <FeatureCard
            icon={<CircleDollarSign className="w-5 h-5" />}
            title="Wallet & Usage"
            description="Control communication spend. Track minutes and keep costs under control."
          />
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white">How Tessa works</h2>
            <p className="mt-3 text-slate-400">Simple process. Powerful results.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step number="01" title="Import your list" description="Upload any county surplus or tax deed CSV. Map the columns once and import in seconds." />
            <Step number="02" title="Work the claims" description="Call, email, and update status. Every action is automatically logged against the claim." />
            <Step number="03" title="Close & track" description="Move deals to Closed Won and see recovered surplus amounts in real time." />
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white">Trusted by recovery teams</h2>
          <p className="mt-3 text-slate-400">What early users are saying</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Testimonial
            quote="We used to lose track of which relative we had already called. Tessa keeps everything in one place."
            name="Marcus T."
            role="Surplus Recovery Operator"
          />
          <Testimonial
            quote="The CSV importer alone saved us hours every week. Mapping phones and emails properly is a game changer."
            name="Aisha K."
            role="Operations Manager"
          />
          <Testimonial
            quote="Finally a CRM that actually understands how surplus funds work instead of forcing us into a generic sales tool."
            name="David R."
            role="Founder, Asset Recovery Firm"
          />
        </div>
      </section>

      {/* ========== UPCOMING ========== */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-10">
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium mb-4">
            <BarChart3 className="w-4 h-4" />
            Coming Soon
          </div>
          <h2 className="text-2xl font-bold text-white mb-6">What’s next for Tessa</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UpcomingItem text="Mobile app for field agents" />
            <UpcomingItem text="Automated skip-tracing integrations" />
            <UpcomingItem text="Digital agreement / e-signature" />
            <UpcomingItem text="Advanced reporting & forecasting" />
            <UpcomingItem text="Buy & manage Twilio numbers inside the platform" />
            <UpcomingItem text="Wallet top-up with secure payment gateway" />
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="border-t border-slate-800 bg-slate-900/60">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to run your recovery operation properly?
          </h2>
          <p className="text-slate-400 mb-8">
            Create your workspace in minutes and start importing your first list today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto text-slate-300 hover:text-white font-medium px-6 py-3.5 transition"
            >
              Already have an account? Login
            </Link>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Tessa CRM</span>
          </div>
          <p>© {new Date().getFullYear()} Tessa Holdings. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ========== Small Components ========== */

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
      <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-indigo-500/30 mb-3">{number}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <p className="text-slate-300 text-sm leading-relaxed mb-5">“{quote}”</p>
      <div>
        <p className="font-medium text-white text-sm">{name}</p>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
    </div>
  );
}

function UpcomingItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-slate-300">
      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
      {text}
    </div>
  );
}