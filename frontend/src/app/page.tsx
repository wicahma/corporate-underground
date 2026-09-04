import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  Eye,
  Users,
  TrendingUp,
  MessageCircle,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Corporate Underground — Suara Jujur dari Tempat Kerja",
  description:
    "Jaringan sosial anonim untuk karyawan perusahaan. Bicara jujur tentang pekerjaanmu tanpa nama terlampir.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#101010] text-[#f3f5f7]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#101010]/80 border-b border-[#262626]">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#f3f5f7]" />
            <span className="font-semibold text-[15px]">
              Corporate Underground
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full text-sm font-medium text-[#f3f5f7] hover:bg-white/5 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-5 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-[640px] mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="text-[32px] sm:text-[48px] font-bold leading-tight tracking-tight mb-4">
          Tempat kerjamu.
          <br />
          Tanpa namamu terlampir.
        </h1>
        <p className="text-[17px] text-[#777777] leading-relaxed max-w-[480px] mx-auto mb-8">
          Jaringan sosial anonim untuk karyawan perusahaan. Bicara jujur tentang
          pekerjaanmu — identitasmu tetap terlindungi di balik pseudonim.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-white text-black text-[15px] font-semibold hover:bg-white/90 transition-colors"
          >
            Mulai Sekarang
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3 rounded-full border border-[#262626] text-[#f3f5f7] text-[15px] font-semibold hover:bg-white/5 transition-colors"
          >
            Sudah Punya Akun? Masuk
          </Link>
        </div>
      </section>

      {/* Feed Preview */}
      <section className="max-w-[640px] mx-auto px-4 pb-16">
        <div className="card p-4 border-[#262626] bg-[#181818] rounded-2xl space-y-4">
          {/* Mock Post 1 */}
          <div className="flex gap-3">
            <div className="w-10 flex flex-col items-center shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                SF
              </div>
              <div className="w-[2px] flex-1 bg-[#262626] my-2 rounded-full min-h-[20px]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm mb-1 flex-wrap">
                <span className="font-semibold text-[15px] text-[#f3f5f7]">
                  Silent Fox
                </span>
                <CheckCircle2 className="w-4 h-4 text-[#0095f6]" />
                <span className="text-[13px] text-[#777777]">• 2j</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#262626] text-[#777777]">
                  Catatan
                </span>
              </div>
              <p className="text-[15px] leading-relaxed text-[#f3f5f7] mb-3">
                Meeting 2 jam yang harusnya bisa jadi email 5 menit. Tapi ya
                sudahlah, yang penting ada snack gratisnya 🍪
              </p>
              <div className="flex items-center gap-1 text-sm -ml-1">
                <div className="flex items-center gap-1.5 text-[#777777] hover:text-[#f3f5f7] p-2 -m-1 rounded-full transition-colors">
                  <MessageCircle className="w-[18px] h-[18px]" />
                  <span className="text-[13px] font-medium">12</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#777777] hover:text-[#f3f5f7] p-2 -m-1 rounded-full transition-colors">
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Mock Post 2 */}
          <div className="flex gap-3">
            <div className="w-10 flex flex-col items-center shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                NO
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm mb-1 flex-wrap">
                <span className="font-semibold text-[15px] text-[#f3f5f7]">
                  Neon Owl
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-400 bg-amber-500/10 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Bukan Karyawan
                </span>
                <span className="text-[13px] text-[#777777]">• 5j</span>
              </div>
              <p className="text-[15px] leading-relaxed text-[#f3f5f7] mb-3">
                Ada yang tahu nggak kenapa kebijakan WFH baru ini rasanya lebih
                ketat dari sebelumnya? 🤔
              </p>
              <div className="flex items-center gap-1 text-sm -ml-1">
                <div className="flex items-center gap-1.5 text-[#ff3040] p-2 -m-1 rounded-full">
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span className="text-[13px] font-medium">28</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#777777] hover:text-[#f3f5f7] p-2 -m-1 rounded-full transition-colors">
                  <MessageCircle className="w-[18px] h-[18px]" />
                  <span className="text-[13px] font-medium">7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-[900px] mx-auto px-4 py-16">
        <h2 className="text-[28px] sm:text-[36px] font-bold text-center mb-12">
          Kenapa Corporate Underground?
        </h2>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Feature 1 */}
          <div className="card p-6 border-[#262626] bg-[#181818] rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-[#262626] flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-[#0095f6]" />
            </div>
            <h3 className="text-[17px] font-semibold mb-2">
              Hanya Karyawan Terverifikasi
            </h3>
            <p className="text-[15px] text-[#777777] leading-relaxed">
              Setiap anggota harus membuktikan status kepegawaiannya melalui
              email perusahaan atau kode rahasia. Tidak ada outsider.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card p-6 border-[#262626] bg-[#181818] rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-[#262626] flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-[#0095f6]" />
            </div>
            <h3 className="text-[17px] font-semibold mb-2">
              Anonimitas Total
            </h3>
            <p className="text-[15px] text-[#777777] leading-relaxed">
              Identitas aslimu tidak pernah muncul. Setiap perusahaan memiliki
              pseudonim unik yang konsisten — tidak ada yang bisa melacak
              kembali ke dirimu.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card p-6 border-[#262626] bg-[#181818] rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-[#262626] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-[#ff3040]" />
            </div>
            <h3 className="text-[17px] font-semibold mb-2">
              Deteksi Kebocoran Identitas
            </h3>
            <p className="text-[15px] text-[#777777] leading-relaxed">
              Sistem kami memindai postingan untuk mendeteksi informasi yang
              bisa membocorkan identitasmu. Peringatan sebelum kamu memposting.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="card p-6 border-[#262626] bg-[#181818] rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-[#262626] flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-[#0095f6]" />
            </div>
            <h3 className="text-[17px] font-semibold mb-2">
              Pulse Perusahaan
            </h3>
            <p className="text-[15px] text-[#777777] leading-relaxed">
              Lihat bagaimana perasaan rekan kerjamu secara agregat. Check-in
              harian, topik trending, dan sentimen — semuanya anonim.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-[640px] mx-auto px-4 py-16">
        <h2 className="text-[28px] sm:text-[36px] font-bold text-center mb-12">
          Cara Kerjanya
        </h2>

        <div className="space-y-8">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-[15px] font-bold shrink-0">
              1
            </div>
            <div>
              <h3 className="text-[17px] font-semibold mb-1">
                Daftar & Verifikasi
              </h3>
              <p className="text-[15px] text-[#777777] leading-relaxed">
                Buat akun dan verifikasi status kepegawaianmu melalui email
                perusahaan atau kode rahasia.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-[15px] font-bold shrink-0">
              2
            </div>
            <div>
              <h3 className="text-[17px] font-semibold mb-1">
                Dapatkan Pseudonim
              </h3>
              <p className="text-[15px] text-[#777777] leading-relaxed">
                Sistem memberikan pseudonim unik untuk setiap perusahaan.
                Pseudonim ini konsisten — tidak ada yang bisa menghubungkannya
                ke identitasmu.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-[15px] font-bold shrink-0">
              3
            </div>
            <div>
              <h3 className="text-[17px] font-semibold mb-1">
                Bicara dengan Jujur
              </h3>
              <p className="text-[15px] text-[#777777] leading-relaxed">
                Posting, berkomentar, dan berdiskusi tentang pekerjaanmu.
                Identitasmu tetap aman di balik pseudonim.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-[640px] mx-auto px-4 py-16 text-center">
        <h2 className="text-[28px] sm:text-[36px] font-bold mb-4">
          Siap Bergabung?
        </h2>
        <p className="text-[17px] text-[#777777] mb-8 max-w-[480px] mx-auto">
          Bergabunglah dengan ribuan karyawan yang sudah berbicara jujur tentang
          pekerjaan mereka.
        </p>
        <Link
          href="/register"
          className="inline-block px-8 py-3 rounded-full bg-white text-black text-[15px] font-semibold hover:bg-white/90 transition-colors"
        >
          Mulai Sekarang
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#262626] mt-16">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#777777] text-sm">
              <Lock className="w-4 h-4" />
              <span>Corporate Underground</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#777777]">
              <a href="#" className="hover:text-[#f3f5f7] transition-colors">
                Tentang
              </a>
              <a href="#" className="hover:text-[#f3f5f7] transition-colors">
                Privasi
              </a>
              <a href="#" className="hover:text-[#f3f5f7] transition-colors">
                Ketentuan
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
