"use client";

import { useState } from "react";
import { verificationApi, type Company } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Mail,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export function CompanyVerificationCard({
  companySlug,
  companyName,
  onVerified,
}: {
  companySlug: string;
  companyName?: string;
  onVerified?: () => void;
}) {
  const { refresh } = useAuth();
  const [tab, setTab] = useState<"code" | "email">("code");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await verificationApi.claimCode(code.trim(), companySlug);
      setSuccess(true);
      showToast("Berhasil terverifikasi sebagai karyawan resmi!", "success");
      await refresh();
      onVerified?.();
    } catch (err: unknown) {
      setError((err as Error).message || "Kode verifikasi salah atau kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await verificationApi.requestEmail(companySlug, email.trim());
      setRequestId(res.requestId);
      showToast("Kode OTP telah dikirim ke email kantor.", "info");
    } catch (err: unknown) {
      setError((err as Error).message || "Gagal mengirim OTP ke email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !requestId) return;
    setLoading(true);
    setError(null);
    try {
      await verificationApi.verifyOtp(requestId, otp.trim());
      setSuccess(true);
      showToast("Berhasil terverifikasi via email kantor!", "success");
      await refresh();
      onVerified?.();
    } catch (err: unknown) {
      setError((err as Error).message || "OTP salah atau telah kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card p-5 mb-5 border-emerald-500/30 bg-emerald-950/20 text-[#f3f5f7] rounded-2xl flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-emerald-300">Status Karyawan Terverifikasi</h4>
          <p className="text-xs text-neutral-400 mt-0.5">
            Akunmu kini memiliki badge Centang Biru resmi untuk {companyName ?? companySlug}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 mb-6 border-amber-500/30 bg-[#161410] rounded-2xl">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-[#f3f5f7] flex items-center gap-1.5">
              <span>Status: Belum Terverifikasi</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Unverified
              </span>
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            Kamu bergabung sebagai tamu. Verifikasi status karyawan di{" "}
            <span className="text-neutral-200 font-medium">{companyName ?? companySlug}</span>{" "}
            untuk menghapus label peringatan dan mendapatkan badge Centang Biru resmi.
          </p>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 mt-4 mb-3 border-b border-[#262626] pb-2">
            <button
              type="button"
              onClick={() => {
                setTab("code");
                setError(null);
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                tab === "code"
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Kode Rahasia
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("email");
                setError(null);
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                tab === "email"
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email Kantor
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Code Tab */}
          {tab === "code" && (
            <form onSubmit={handleVerifyCode} className="flex items-center gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Masukkan Company Secret Code..."
                className="flex-1 bg-[#101010] border border-[#262626] focus:border-neutral-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="rounded-xl bg-white text-black font-semibold text-xs px-4 py-2 hover:bg-white/90 disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Verifikasi
              </button>
            </form>
          )}

          {/* Email Tab */}
          {tab === "email" && (
            <div>
              {!requestId ? (
                <form onSubmit={handleRequestOtp} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    className="flex-1 bg-[#101010] border border-[#262626] focus:border-neutral-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-colors"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="rounded-xl bg-white text-black font-semibold text-xs px-4 py-2 hover:bg-white/90 disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    Kirim OTP
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Masukkan 6 digit OTP"
                    maxLength={6}
                    className="flex-1 bg-[#101010] border border-[#262626] focus:border-neutral-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-colors tracking-widest text-center font-mono"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !otp.trim()}
                    className="rounded-xl bg-white text-black font-semibold text-xs px-4 py-2 hover:bg-white/90 disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    Verifikasi OTP
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
