// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import React, { useState } from 'react';
import {
  Wallet, LayoutDashboard, ScanLine, Coins, PiggyBank, Bitcoin, Globe,
  Sparkles, ShieldCheck, Bell, ArrowRight, Check, WifiOff, Languages,
  HeartHandshake, Code2, Menu, Send, Github
} from 'lucide-react';
import HowToGuide from './HowToGuide';
import ThemeToggle from './ThemeToggle';

interface LandingPageProps {
  onGetStarted: () => void;
  onAbout: () => void;
}

const FEATURES = [
  { icon: LayoutDashboard, color: 'text-indigo-600 bg-indigo-50', title: 'ផ្ទាំងគ្រប់គ្រង', en: 'Dashboard', desc: 'A clear snapshot of income, expenses, and trends, with AI insights in Khmer.' },
  { icon: ScanLine, color: 'text-rose-600 bg-rose-50', title: 'ស្កេនវិក្កយបត្រ', en: 'Receipt Scanning', desc: 'Snap a photo of a receipt and let AI fill in the transaction for you.' },
  { icon: Coins, color: 'text-amber-600 bg-amber-50', title: 'កម្ចី', en: 'Lending', desc: 'Track loans with a full month-by-month repayment schedule in KHR and USD.' },
  { icon: PiggyBank, color: 'text-emerald-600 bg-emerald-50', title: 'ការសន្សំ', en: 'Savings Goals', desc: 'Set goals, watch your progress, and get gentle reminders to keep saving.' },
  { icon: Bitcoin, color: 'text-orange-600 bg-orange-50', title: 'គ្រីបតូ & Wallet', en: 'Crypto & Wallet', desc: 'Track your portfolio with live prices and a secure wallet on Base.' },
  { icon: Globe, color: 'text-sky-600 bg-sky-50', title: 'សហគមន៍', en: 'Community', desc: 'Share money tips and insights in a friendly, AI-moderated community feed.' },
];

const WHY = [
  { icon: Languages, title: 'Dual currency', desc: 'Riel and Dollar are first-class everywhere, with automatic conversion.' },
  { icon: WifiOff, title: 'Offline-first', desc: 'Works fully offline as a guest. Sign in to sync across your devices.' },
  { icon: Sparkles, title: 'AI-powered', desc: 'Advice, receipt scanning, and smart categories powered by Google Gemini.' },
  { icon: HeartHandshake, title: 'Community-owned', desc: 'A free, open-source project built by students, for everyone.' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onAbout }) => {
  const [showHowTo, setShowHowTo] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md -rotate-6">C</div>
            <span className="font-bold text-lg tracking-tight">CHORNOR</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <button onClick={() => scrollTo('features')} className="hover:text-indigo-600 transition-colors">Features</button>
            <button onClick={() => scrollTo('why')} className="hover:text-indigo-600 transition-colors">Why Chornor</button>
            <button onClick={() => scrollTo('opensource')} className="hover:text-indigo-600 transition-colors">Open Source</button>
            <button onClick={onAbout} className="hover:text-indigo-600 transition-colors">About Us</button>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100" />
            <button
              onClick={onGetStarted}
              className="hidden sm:inline-flex items-center gap-1.5 bg-indigo-600 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              ចាប់ផ្ដើម <ArrowRight size={16} />
            </button>
            <button onClick={() => setMenuOpen(o => !o)} className="md:hidden p-2 text-gray-600" aria-label="Menu">
              <Menu size={22} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-5 py-3 flex flex-col gap-3 text-sm font-medium text-gray-600">
            <button onClick={() => scrollTo('features')} className="text-left py-1">Features</button>
            <button onClick={() => scrollTo('why')} className="text-left py-1">Why Chornor</button>
            <button onClick={() => scrollTo('opensource')} className="text-left py-1">Open Source</button>
            <button onClick={onAbout} className="text-left py-1">About Us</button>
            <button onClick={onGetStarted} className="mt-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl">
              ចាប់ផ្ដើម (Get Started) <ArrowRight size={16} />
            </button>
          </div>
        )}
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-700 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/25 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-6">
              <Sparkles size={14} className="text-amber-300" /> Free &amp; Open Source
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Your money,<br />
              <span className="bg-gradient-to-r from-amber-200 to-pink-200 bg-clip-text text-transparent">simplified.</span>
            </h1>
            <p className="mt-3 text-lg font-medium text-indigo-100">ចំណូលចំណាយ · គ្រប់គ្រងហិរញ្ញវត្ថុផ្ទាល់ខ្លួន</p>
            <p className="mt-5 text-base md:text-lg text-indigo-100/90 max-w-lg leading-relaxed">
              Chornor is a free, open-source personal finance app built for Cambodia.
              Track spending in Riel and Dollar, manage loans and savings, scan receipts
              with AI, and more, online or offline.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
              >
                ចាប់ផ្ដើមឥឡូវនេះ (Get Started) <ArrowRight size={18} />
              </button>
              <button
                onClick={() => scrollTo('features')}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/25 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
              >
                Explore features
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-indigo-100">
              {['Free forever', 'Works offline', 'No ads'].map(t => (
                <span key={t} className="inline-flex items-center gap-1.5"><Check size={16} className="text-emerald-300" /> {t}</span>
              ))}
            </div>
          </div>

          {/* App preview mock */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl p-5 text-gray-800 max-w-sm mx-auto rotate-1 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Total Balance</p>
                  <p className="text-2xl font-extrabold text-gray-900">$1,284.50</p>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-md bg-white shadow-sm text-indigo-600">USD</span>
                  <span className="px-2.5 py-1 rounded-md text-gray-400">KHR</span>
                </div>
              </div>
              <div className="flex items-end gap-2 h-24 mb-4">
                {[45, 70, 38, 82, 55, 90, 62].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500 to-violet-400" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="space-y-2.5">
                {[
                  { i: PiggyBank, c: 'bg-emerald-50 text-emerald-600', t: 'Savings goal', a: '+$50.00' },
                  { i: ScanLine, c: 'bg-rose-50 text-rose-600', t: 'Market (scanned)', a: '-14,500៛' },
                  { i: Coins, c: 'bg-amber-50 text-amber-600', t: 'Loan payment', a: '-$120.00' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${r.c}`}><r.i size={16} /></div>
                    <span className="text-sm font-medium text-gray-600 flex-1">{r.t}</span>
                    <span className="text-sm font-bold text-gray-800">{r.a}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 -left-2 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 text-gray-800 rotate-[-6deg] hidden sm:flex">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><Sparkles size={16} /></div>
              <span className="text-xs font-bold">AI Coach ready</span>
            </div>
          </div>
        </div>

        {/* incubation strip */}
        <div className="relative border-t border-white/10 bg-black/10">
          <div className="max-w-6xl mx-auto px-5 py-3 text-center text-xs md:text-sm text-indigo-100/80">
            Incubated by <span className="font-semibold text-white">CamboVerse Center</span>, National University of Management
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-indigo-600 font-bold text-sm uppercase tracking-wide mb-2">Everything in one place</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">One app for all your money</h2>
          <p className="mt-3 text-gray-500">From daily spending to loans, savings, and crypto, Chornor brings your whole financial life together.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.en} className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-lg transition-all">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon size={24} />
              </div>
              <h3 className="font-bold text-lg text-gray-900">{f.title}</h3>
              <p className="text-xs font-semibold text-indigo-500 mb-2">{f.en}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Why Chornor ===== */}
      <section id="why" className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Built for the way Cambodia saves</h2>
            <p className="mt-3 text-gray-500">Thoughtful defaults that fit real life here.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY.map(w => (
              <div key={w.title} className="p-6 rounded-2xl bg-white border border-gray-100">
                <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-4">
                  <w.icon size={22} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{w.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Open source band ===== */}
      <section id="opensource" className="max-w-6xl mx-auto px-5 py-16 md:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 to-purple-700 text-white p-8 md:p-14">
          <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-5">
                <Code2 size={14} /> 100% Open Source
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold leading-snug">A community project, free forever</h2>
              <p className="mt-4 text-indigo-100/90 leading-relaxed">
                Chornor is owned by the student team <span className="font-semibold text-white">Tomorrow Rich Together</span>.
                It is sustained through community support, donations, grants, and training,
                never by selling your data or the software.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={onGetStarted} className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors">
                  Get Started <ArrowRight size={16} />
                </button>
                <a href="https://github.com/camboversecenter/Chornor" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/10 border border-white/25 font-semibold px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors">
                  <Code2 size={16} /> View on GitHub
                </a>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: ShieldCheck, t: 'Your data stays yours', d: 'Guest mode never leaves your device. No ads, no tracking.' },
                { icon: Bell, t: 'Smart reminders', d: 'Never miss a loan payment, bill, or savings deposit.' },
                { icon: Wallet, t: 'Secure by design', d: 'Wallet keys are protected and never exposed to the page.' },
              ].map(x => (
                <div key={x.t} className="flex gap-3 p-4 rounded-2xl bg-white/10 border border-white/15">
                  <div className="p-2 rounded-lg bg-white/15 h-fit"><x.icon size={20} /></div>
                  <div>
                    <p className="font-bold text-sm">{x.t}</p>
                    <p className="text-sm text-indigo-100/80">{x.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="max-w-6xl mx-auto px-5 pb-20 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Take control of your money today</h2>
        <p className="mt-3 text-gray-500 max-w-xl mx-auto">Start free in seconds. No sign-up needed to try it as a guest.</p>
        <button
          onClick={onGetStarted}
          className="mt-8 inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg text-lg"
        >
          ចាប់ផ្ដើមឥឡូវនេះ (Get Started) <ArrowRight size={20} />
        </button>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-5 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg -rotate-6">C</div>
                <span className="font-bold text-lg text-white">CHORNOR</span>
              </div>
              <p className="text-sm max-w-sm leading-relaxed">
                Free, open-source personal finance for Cambodia. Owned by the student team
                Tomorrow Rich Together, incubated by the CamboVerse Center at the National
                University of Management.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-4 md:justify-end text-sm">
              <div className="flex flex-col gap-2">
                <span className="text-white font-semibold mb-1">Product</span>
                <button onClick={() => scrollTo('features')} className="text-left hover:text-white transition-colors">Features</button>
                <button onClick={() => setShowHowTo(true)} className="text-left hover:text-white transition-colors">How to use</button>
                <button onClick={onGetStarted} className="text-left hover:text-white transition-colors">Get Started</button>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-white font-semibold mb-1">Project</span>
                <button onClick={onAbout} className="text-left hover:text-white transition-colors">About Us</button>
                <a href="https://t.me/+VnJNjvNbXpQ3MWM1" target="_blank" rel="noopener noreferrer" className="text-left inline-flex items-center gap-1.5 hover:text-white transition-colors"><Send size={13} /> Telegram</a>
                <a href="https://github.com/camboversecenter/Chornor" target="_blank" rel="noopener noreferrer" className="text-left inline-flex items-center gap-1.5 hover:text-white transition-colors"><Github size={13} /> GitHub</a>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span>© {new Date().getFullYear()} Tomorrow Rich Together · Ver. 0.02 (Beta)</span>
            <a href="https://github.com/camboversecenter/Chornor" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white transition-colors"><Code2 size={13} /> Source code on GitHub</a>
          </div>
        </div>
      </footer>

      {showHowTo && <HowToGuide onClose={() => setShowHowTo(false)} />}
    </div>
  );
};

export default LandingPage;
