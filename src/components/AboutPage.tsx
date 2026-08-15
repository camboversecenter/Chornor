// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import React from 'react';
import {
  ArrowLeft, ArrowRight, Send, ExternalLink, Users, HeartHandshake,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface AboutPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

const TELEGRAM_URL = 'https://t.me/+VnJNjvNbXpQ3MWM1';

// Team photos live in public/. Names are placeholders (to be renamed later);
// every role is "Member" per the current team listing.
const TEAM_IMAGES = [
  'image1.jpg',
  'DSC_1926 copy.jpg',
  'IMG_20260810_123458_582.jpg',
  'IMG_20260815_102936.jpg',
  'IMG_20260815_105706_349.jpg',
  'IMG_3623.PNG',
  'IMG_4001.JPG',
  'IMG_4534.PNG',
  'IMG_6846.JPG',
  'IMG_9244.JPG',
  'IMG_9393.JPG',
  'MYXJ_20250925141435597_save.jpg',
];

const TEAM = TEAM_IMAGES.map((file, i) => ({
  name: `Member ${String(i + 1).padStart(2, '0')}`,
  role: 'Member',
  img: '/' + encodeURIComponent(file),
}));

const PARTNERS = [
  {
    logo: '/num.png',
    name: 'National University of Management',
    role: 'សាកលវិទ្យាល័យម្ចាស់ផ្ទះ (Host University)',
    desc: 'Chornor is hosted at the National University of Management in Phnom Penh.',
    url: 'https://num.edu.kh/',
    label: 'num.edu.kh',
  },
  {
    logo: '/camboverse.png',
    name: 'CamboVerse Center',
    role: 'អង្គភាពបណ្តុះ (Incubator)',
    desc: 'Chornor is incubated by the CamboVerse Center at NUM, which supports Cambodian technology projects.',
    url: 'https://camboverse.world',
    label: 'camboverse.world',
  },
  {
    logo: '/e-khmer.png',
    name: 'E-KHMER Technology Co., Ltd.',
    role: 'ដៃគូបច្ចេកវិទ្យា (Technology Partner)',
    desc: 'E-KHMER contributes engineering and technical support to the platform.',
    url: 'https://e-khmer.com',
    label: 'e-khmer.com',
  },
];

const AboutPage: React.FC<AboutPageProps> = ({ onBack, onGetStarted }) => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={20} />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md -rotate-6">C</div>
              <span className="font-bold text-lg tracking-tight text-gray-900">CHORNOR</span>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100" />
            <button
              onClick={onGetStarted}
              className="hidden sm:inline-flex items-center gap-1.5 bg-indigo-600 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              ចាប់ផ្ដើម <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Intro */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-700 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/25 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-5 py-16 md:py-20 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-6">
            <Users size={14} /> អំពីពួកយើង (About Us)
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">The team behind Chornor</h1>
          <p className="mt-5 text-base md:text-lg text-indigo-100/90 max-w-2xl mx-auto leading-relaxed">
            Chornor is a free, open-source personal finance app for Cambodia, built by the
            student team <span className="font-semibold text-white">Tomorrow Rich Together</span> and
            incubated by the CamboVerse Center at the National University of Management.
          </p>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-6xl mx-auto px-5 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-indigo-600 font-bold text-sm uppercase tracking-wide mb-2">Tomorrow Rich Together</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">ក្រុមការងារ (Our Team)</h2>
          <p className="mt-3 text-gray-500">The students building and maintaining Chornor.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {TEAM.map((m) => (
            <div key={m.img} className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg">
                  <img
                    src={m.img}
                    alt={m.name}
                    loading="lazy"
                    className="w-full h-full rounded-full object-cover object-[center_top] border-4 border-white bg-gray-100"
                  />
                </div>
              </div>
              <h3 className="mt-4 font-bold text-gray-900">{m.name}</h3>
              <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Partners & Incubator */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">ដៃគូ និងអ្នកគាំទ្រ (Partners and supporters)</h2>
            <p className="mt-3 text-gray-500">Chornor is incubated by the CamboVerse Center at the National University of Management.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {PARTNERS.map((p) => (
              <div key={p.name} className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all">
                <div
                  className="h-20 w-full max-w-[220px] mb-5 px-5 flex items-center justify-center rounded-xl border border-gray-200 shadow-sm"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <img src={p.logo} alt={p.name} loading="lazy" className="max-h-14 max-w-full object-contain" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 leading-tight">{p.name}</h3>
                <p className="mt-1.5 text-sm font-semibold text-indigo-500">{p.role}</p>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <ExternalLink size={14} /> {p.label}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community / Telegram */}
      <section className="max-w-6xl mx-auto px-5 py-16 md:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 to-purple-700 text-white p-8 md:p-14 text-center">
          <div className="absolute top-0 right-0 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 mb-5">
              <HeartHandshake size={28} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold">Join our community</h2>
            <p className="mt-3 text-indigo-100/90 max-w-xl mx-auto">
              Ask questions, share feedback, and follow updates on our Telegram channel.
            </p>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              <Send size={18} /> Join us on Telegram
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg -rotate-6">C</div>
            <span className="font-bold text-white">CHORNOR</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <button onClick={onBack} className="hover:text-white transition-colors">Home</button>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
              <Send size={14} /> Telegram
            </a>
          </div>
          <span className="text-xs">© {new Date().getFullYear()} Tomorrow Rich Together</span>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
