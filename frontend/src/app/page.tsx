import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  Eye,
  Zap,
  Terminal,
  Activity,
  MessageCircle,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Radio,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Corporate Underground — Panggung Ghibah Asri & Aman",
  description:
    "Jaringan sosial anonim karyawan terverifikasi. LinkedIn versi ghibah lokal: pseudonim hewan lucu, AI penjaga santuy, mode karyawan teladan, dan zero drama.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0e] text-[#f3f5f7] selection:bg-[#ccff00] selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0a0b0e]/85 border-b border-[#232734]">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#ccff00]" />
            <span className="font-bold text-[15px] tracking-tight">
              Corporate Underground
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-[#343a4e] text-[#8c93a8]">
              Absurd Hackathon 2026
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-md text-sm font-medium text-[#8c93a8] hover:text-[#f3f5f7] transition-colors font-mono"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-5 py-1.5 rounded-md bg-[#ccff00] text-black text-sm font-bold hover:bg-[#b8e600] transition-colors"
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-[800px] mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#343a4e] bg-[#12141a] text-[#ccff00] text-xs font-mono mb-6">
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
          LinkedIn Versi Ghibah Lokal &bull; Aman & Santai
        </div>
        <h1 className="text-[36px] sm:text-[56px] font-extrabold leading-[1.1] tracking-tight mb-6">
          Semua orang butuh tempat curhat & bahan obrolan.
        </h1>
        <p className="text-[17px] sm:text-[19px] text-[#8c93a8] leading-relaxed max-w-[580px] mx-auto mb-8">
          Wadah digital anonim karyawan terverifikasi. Curhat mesin kopi, bahas kebijakan tanpa nama basah, dan kabur ke mode karyawan teladan dalam 0.3 detik.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-md bg-[#ccff00] text-black text-[15px] font-bold hover:bg-[#b8e600] transition-colors flex items-center justify-center gap-2"
          >
            Mulai Curhat Santai <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-md border border-[#343a4e] text-[#f3f5f7] text-[15px] font-medium hover:bg-[#181a22] transition-colors"
          >
            Sudah Punya Akun? Masuk
          </Link>
        </div>

        {/* Quick Spec Strip */}
        <div className="mt-12 pt-6 border-t border-[#232734] flex flex-wrap items-center justify-center gap-4 sm:gap-8 font-mono text-xs text-[#565d73]">
          <div>TARGET: <span className="text-[#8c93a8]">Karyawan Perlu Wadah</span></div>
          <span>&bull;</span>
          <div>FITUR: <span className="text-[#8c93a8]">Pseudonim + AI Santuy + Panic Button</span></div>
          <span>&bull;</span>
          <div>INFRA: <span className="text-[#8c93a8]">ThinkCentre M710q (14W)</span></div>
        </div>
      </section>

      {/* Live Feed Mockup */}
      <section className="max-w-[680px] mx-auto px-4 pb-16">
        <div className="p-5 border border-[#343a4e] bg-[#12141a] rounded-xl space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#232734] font-mono text-xs text-[#8c93a8]">
            <span className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#ccff00] animate-pulse" />
              LIVE SSE FEED // BERIJALAN NETWORK
            </span>
            <span>REALTIME UPDATE</span>
          </div>

          {/* Post 1: Verified Employee */}
          <div className="flex gap-3 pt-2">
            <div className="w-10 flex flex-col items-center shrink-0">
              <div className="w-9 h-9 rounded-md bg-[#181a22] border border-[#343a4e] flex items-center justify-center text-[#ccff00] text-xs font-mono font-bold">
                CP
              </div>
              <div className="w-[1px] flex-1 bg-[#232734] my-2 min-h-[24px]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm mb-1 flex-wrap">
                <span className="font-semibold text-[15px] text-[#f3f5f7]">
                  Cozy Panda
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Karyawan Tetap
                </span>
                <span className="text-xs text-[#565d73] font-mono">• 2m lalu</span>
              </div>
              <p className="text-[15px] leading-relaxed text-[#f3f5f7] mb-3">
                Meeting evaluasi 2 jam yang sebenarnya cukup 1 baris chat Slack. Untung pantry hari ini ada martabak manis gratis 🧇☕
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-[#8c93a8]">
                <div className="flex items-center gap-1.5 hover:text-[#f3f5f7] cursor-pointer">
                  <MessageCircle className="w-4 h-4" />
                  <span>14 komentar</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#ff3344]">
                  <span>❤️ 32 setuju</span>
                </div>
              </div>
            </div>
          </div>

          {/* Post 2: Guest / Unverified */}
          <div className="flex gap-3 pt-2">
            <div className="w-10 flex flex-col items-center shrink-0">
              <div className="w-9 h-9 rounded-md bg-[#181a22] border border-[#343a4e] flex items-center justify-center text-[#ffaa00] text-xs font-mono font-bold">
                SO
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm mb-1 flex-wrap">
                <span className="font-semibold text-[15px] text-[#f3f5f7]">
                  Sleepy Otter
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/30">
                  <AlertTriangle className="w-3 h-3" />
                  Tamu Santai
                </span>
                <span className="text-xs text-[#565d73] font-mono">• 12m lalu</span>
              </div>
              <p className="text-[15px] leading-relaxed text-[#f3f5f7] mb-3">
                Mampir dari kantor sebelah mau nanya: di lantai 3 AC-nya emang beneran disetel kutub utara ya? Butuh rekomendasi jaket tebal 🥶
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-[#8c93a8]">
                <div className="flex items-center gap-1.5 hover:text-[#f3f5f7] cursor-pointer">
                  <MessageCircle className="w-4 h-4" />
                  <span>8 respons</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#ffaa00]">
                  <span>☕ 19 relate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid based on Absurd Pitch Deck */}
      <section className="max-w-[1100px] mx-auto px-4 py-16 border-t border-[#232734]">
        <div className="text-center max-w-[640px] mx-auto mb-16">
          <div className="text-xs font-mono text-[#ccff00] uppercase tracking-wider mb-2">
            [ FITUR UNIK // SLIDE 03-06 ]
          </div>
          <h2 className="text-[28px] sm:text-[40px] font-bold tracking-tight mb-4">
            Dirancang Aman, Santuy & Bebas Drama
          </h2>
          <p className="text-[16px] text-[#8c93a8]">
            Bukan sekadar anonim biasa. Semua modul dirancang untuk menjaga karir dan mood kerja tetap terjaga.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Pseudonim */}
          <div className="p-6 border border-[#232734] bg-[#12141a] rounded-xl hover:border-[#343a4e] transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-4 text-[#8c93a8]">
                <span>MOD-01</span>
                <span className="px-2 py-0.5 rounded border border-[#343a4e] text-[#ccff00]">
                  PENYAMARAN
                </span>
              </div>
              <h3 className="text-[18px] font-bold mb-2 flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#ccff00]" /> Pseudonim Hewan Lucu
              </h3>
              <p className="text-[14px] text-[#8c93a8] leading-relaxed mb-4">
                Hari ini bukan admin galak atau lead pusing. Kamu adalah Cozy Panda atau Sleepy Otter. Email dihash SHA-256 + pepper, identitas asli nol jejak.
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#565d73] pt-4 border-t border-[#232734]">
              IDENTITAS DIHASH &bull; NAMA DIGILIR ACAK
            </div>
          </div>

          {/* Card 2: AI Guard */}
          <div className="p-6 border border-[#232734] bg-[#12141a] rounded-xl hover:border-[#343a4e] transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-4 text-[#8c93a8]">
                <span>MOD-02</span>
                <span className="px-2 py-0.5 rounded border border-[#343a4e] text-[#ff3344]">
                  FAIL-OPEN
                </span>
              </div>
              <h3 className="text-[18px] font-bold mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#ff3344]" /> AI Penjaga yang Santuy
              </h3>
              <p className="text-[14px] text-[#8c93a8] leading-relaxed mb-4">
                Layer 1 cegah bocor NIK, gaji & screenshot. Layer 2 AI cek konteks. Kalau AI lelah mikir (&gt;30s), prinsip kami fail-open: obrolan tetap lolos tayang!
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#565d73] pt-4 border-t border-[#232734]">
              DETERMINISTIK REGEX + AI FEW-SHOT
            </div>
          </div>

          {/* Card 3: Emergency Panic Button */}
          <div className="p-6 border border-[#232734] bg-[#12141a] rounded-xl hover:border-[#343a4e] transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-4 text-[#8c93a8]">
                <span>MOD-03</span>
                <span className="px-2 py-0.5 rounded border border-[#343a4e] text-[#00f0ff]">
                  ESC &bull; ESC
                </span>
              </div>
              <h3 className="text-[18px] font-bold mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#00f0ff]" /> Emergency Panic Button
              </h3>
              <p className="text-[14px] text-[#8c93a8] leading-relaxed mb-4">
                Atasan tiba-tiba lewat belakang meja? Double-tap ESC atau klik floating button, layar auto-redirect ke Google Sheets / Jira dalam 0.3 detik.
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#565d73] pt-4 border-t border-[#232734]">
              MODE KARYAWAN TELADAN SEKETIKA
            </div>
          </div>

          {/* Card 4: Kunjungan Kantor Sebelah */}
          <div className="p-6 border border-[#232734] bg-[#12141a] rounded-xl hover:border-[#343a4e] transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-4 text-[#8c93a8]">
                <span>MOD-04</span>
                <span className="px-2 py-0.5 rounded border border-[#343a4e] text-[#ffaa00]">
                  MULTI-TENANT
                </span>
              </div>
              <h3 className="text-[18px] font-bold mb-2 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#ffaa00]" /> Kunjungan Kantor Sebelah
              </h3>
              <p className="text-[14px] text-[#8c93a8] leading-relaxed mb-4">
                Bosan dengan drama kantor sendiri? Mampir ke komunitas sebelah sebagai Tamu Santai. Tanya mesin kopi atau vibe kantor tanpa repot verifikasi.
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#565d73] pt-4 border-t border-[#232734]">
              GABUNG LANGSUNG &bull; BADGE TAMU
            </div>
          </div>

          {/* Card 5: Realtime Pulse & Temperature */}
          <div className="p-6 border border-[#232734] bg-[#12141a] rounded-xl hover:border-[#343a4e] transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-4 text-[#8c93a8]">
                <span>MOD-05</span>
                <span className="px-2 py-0.5 rounded border border-[#343a4e] text-[#ccff00]">
                  PULSE
                </span>
              </div>
              <h3 className="text-[18px] font-bold mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#ccff00]" /> Suhu &amp; Sentimen Kantor
              </h3>
              <p className="text-[14px] text-[#8c93a8] leading-relaxed mb-4">
                Check-in mood harian secara anonim. Pantau apakah tim lagi santai, overload, atau butuh traktiran kopi sebelum meeting mingguan dimulai.
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#565d73] pt-4 border-t border-[#232734]">
              DAILY AGGREGATE &bull; ZERO TRACKING
            </div>
          </div>

          {/* Card 6: Homelab Tech Stack */}
          <div className="p-6 border border-[#232734] bg-[#12141a] rounded-xl hover:border-[#343a4e] transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-4 text-[#8c93a8]">
                <span>MOD-06</span>
                <span className="px-2 py-0.5 rounded border border-[#343a4e] text-[#00f0ff]">
                  HOMELAB
                </span>
              </div>
              <h3 className="text-[18px] font-bold mb-2 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#00f0ff]" /> 14 Watt Hemat Listrik
              </h3>
              <p className="text-[14px] text-[#8c93a8] leading-relaxed mb-4">
                Didukung ThinkCentre M710q native systemd, NestJS, Next.js, dan PostgreSQL 17. Bebas tagihan cloud ribuan dollar, performa tetap ngebut.
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#565d73] pt-4 border-t border-[#232734]">
              $0 CLOUD BILL &bull; 100% HOMELAB NATIVE
            </div>
          </div>
        </div>
      </section>

      {/* Panic Button Spotlight Banner */}
      <section className="max-w-[1000px] mx-auto px-4 py-12">
        <div className="p-8 border border-[#00f0ff]/40 bg-[#12141a] rounded-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-[#00f0ff] uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Fitur Penyelamat Karir
              </div>
              <h3 className="text-2xl font-bold">
                Atasan lewat? Tekan <span className="font-mono bg-[#1e212b] px-2 py-0.5 rounded border border-[#343a4e]">ESC</span> dua kali.
              </h3>
              <p className="text-sm text-[#8c93a8] max-w-[500px]">
                Dalam 300 milidetik, layar ghibahmu seketika berubah menjadi spreadsheet Google Sheets atau Jira sprint backlog. Produktivitas semu terjamin.
              </p>
            </div>
            <Link
              href="/register"
              className="px-6 py-3 rounded-md bg-[#00f0ff] text-black text-sm font-bold hover:bg-[#00d0e0] transition-colors whitespace-nowrap"
            >
              Coba Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* Absurd Quote Callout */}
      <section className="max-w-[800px] mx-auto px-4 py-12 text-center">
        <blockquote className="border-l-2 border-[#ccff00] pl-6 py-2 text-left bg-[#12141a] rounded-r-xl">
          <p className="text-[18px] sm:text-[20px] font-medium text-[#f3f5f7] italic mb-2">
            &ldquo;Kalau mau baper dan jualan sertifikat, LinkedIn saja. Di sini kita ngopi santai, ketawa, dan curhat aman.&rdquo;
          </p>
          <footer className="text-xs font-mono text-[#8c93a8]">
            // CORPORATE UNDERGROUND &bull; ABSURD HACKATHON 2026
          </footer>
        </blockquote>
      </section>

      {/* CTA Section */}
      <section className="max-w-[640px] mx-auto px-4 py-16 text-center">
        <h2 className="text-[28px] sm:text-[36px] font-bold mb-4">
          Siap Masuk ke Jaringan?
        </h2>
        <p className="text-[16px] text-[#8c93a8] mb-8 max-w-[460px] mx-auto">
          Pilih kantormu, pasang pseudonim hewan favorit, dan nikmati obrolan kerja tanpa rasa was-was.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3 rounded-md bg-[#ccff00] text-black text-[15px] font-bold hover:bg-[#b8e600] transition-colors"
          >
            Daftar Akun Baru
          </Link>
          <Link
            href="/verify"
            className="w-full sm:w-auto px-8 py-3 rounded-md border border-[#343a4e] text-[#f3f5f7] text-[15px] font-medium hover:bg-[#181a22] transition-colors"
          >
            Masuk Langsung / Verifikasi
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#232734] mt-12 bg-[#0a0b0e]">
        <div className="max-w-[1200px] mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#565d73]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#ccff00]" />
            <span className="text-[#8c93a8] font-bold">CORPORATE UNDERGROUND</span>
            <span>&bull;</span>
            <span>14W Homelab Production</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[#f3f5f7] transition-colors">
              Masuk
            </Link>
            <Link href="/register" className="hover:text-[#f3f5f7] transition-colors">
              Daftar
            </Link>
            <Link href="/verify" className="hover:text-[#f3f5f7] transition-colors">
              Verifikasi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
