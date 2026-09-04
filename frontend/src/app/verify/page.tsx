"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  companiesApi,
  verificationApi,
  type Company,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { RequireAuth } from "@/components/RequireAuth";
import {
  ShieldCheck,
  AlertCircle,
  Search,
  Hash,
  Loader2,
  Mail,
  UserCheck,
  Building2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

type Mode = "company" | "code" | "direct";

export default function VerifyPage() {
  return (
    <RequireAuth>
      <Shell>
        <Suspense
          fallback={
            <div className="max-w-xl mx-auto px-4 pt-14 pb-20">
              <div className="card p-8 border-line animate-pulse space-y-4">
                <div className="h-4 bg-panel2 w-1/3" />
                <div className="h-3 bg-panel2 w-2/3" />
              </div>
            </div>
          }
        >
          <VerifyContent />
        </Suspense>
      </Shell>
    </RequireAuth>
  );
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refresh } = useAuth();

  const [mode, setMode] = useState<Mode>("company");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Company | null>(null);
  const [workEmail, setWorkEmail] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const slug = searchParams.get("company");
    if (slug) {
      companiesApi
        .bySlug(slug)
        .then((c) => {
          setSelected(c);
          setMode("company");
        })
        .catch(() => {});
    } else {
      companiesApi
        .list()
        .then((list) => setCompanies(list))
        .catch(() => setCompanies([]));
    }
  }, [searchParams]);

  const filtered = search
    ? companies.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.slug.toLowerCase().includes(search.toLowerCase()),
      )
    : companies;

  const requestOtp = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await verificationApi.requestEmail(selected.slug, workEmail);
      const rid = res.requestId;
      if (!rid) throw new Error("Server returned no request ID.");
      setRequestId(rid);
      setMode("company");
    } catch (err: unknown) {
      setError((err as Error).message || "Gagal mengirim kode OTP.");
    } finally {
      setBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (!requestId) return;
    setBusy(true);
    setError(null);
    try {
      await verificationApi.verifyOtp(requestId, otp);
      setNotice("Verifikasi berhasil! Mengarahkan ke halaman perusahaan...");
      await refresh();
      setTimeout(() => {
        if (selected) router.push(`/c/${selected.slug}`);
      }, 900);
    } catch (err: unknown) {
      setError((err as Error).message || "Kode OTP salah atau kedaluwarsa.");
    } finally {
      setBusy(false);
    }
  };

  const claimCode = async () => {
    if (!inviteCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const slug = searchParams.get("company") ?? undefined;
      const res = await verificationApi.claimCode(inviteCode.trim(), slug);
      await refresh();
      const companyData = res.company as { slug?: string } | undefined;
      const resolvedSlug = companyData?.slug ?? slug;
      if (resolvedSlug) {
        router.push(`/c/${resolvedSlug}`);
      } else {
        setNotice("Kode rahasia diterima. Mengarahkan...");
        setTimeout(() => router.push("/"), 900);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Kode rahasia ditolak.");
    } finally {
      setBusy(false);
    }
  };

  const handleDirectJoin = async (companySlug: string) => {
    setBusy(true);
    setError(null);
    try {
      await companiesApi.join(companySlug);
      await refresh();
      setNotice("Bergabung sebagai unverified member. Mengarahkan...");
      setTimeout(() => {
        router.push(`/c/${companySlug}`);
      }, 500);
    } catch (err: unknown) {
      setError((err as Error).message || "Gagal bergabung ke komunitas.");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-14 pb-20">
      <div className="mb-8">
        <div className="label mb-2">// AKSES KOMUNITAS PERUSAHAAN</div>
        <h1 className="text-xl font-bold tracking-tight text-fg">
          PILIH METODE MASUK
        </h1>
        <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
          Kamu bisa memverifikasi status karyawan menggunakan email kantor atau secret code untuk mendapatkan centang biru resmi, atau langsung bergabung tanpa verifikasi dengan label unverified.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-6">
        {(
          [
            ["company", "Email OTP"],
            ["code", "Secret Code"],
            ["direct", "Masuk Langsung"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`tab ${mode === m ? "tab-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="mb-5 p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs">
          {notice}
        </div>
      )}

      {/* Mode: Secret Code */}
      {mode === "code" && (
        <div className="card p-6 border-line space-y-4">
          <div className="flex items-center gap-2 text-dim">
            <Hash className="w-4 h-4" />
            <span className="text-xs">
              Masukkan Invitation / Secret Code yang diberikan oleh admin komunitas perusahaanmu.
            </span>
          </div>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="XXXX-XXXX-XXXX"
            className="input font-mono tracking-[0.2em] text-center uppercase text-sm"
          />
          <button
            onClick={() => void claimCode()}
            disabled={busy || !inviteCode.trim()}
            className="btn btn-primary w-full py-3"
          >
            {busy ? "MEMVALIDASI KODE..." : "VERIFIKASI & MASUK"}
          </button>
        </div>
      )}

      {/* Mode: Email OTP */}
      {mode === "company" && (
        <div className="card p-6 border-line">
          {!selected && (
            <div>
              <div className="label mb-3">LANGKAH 01 — CARI PERUSAHAAN</div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau slug perusahaan..."
                  className="input pl-9 text-xs"
                />
              </div>

              {companies.length === 0 && !busy ? (
                <p className="text-xs text-neutral-400 py-3">
                  Belum ada perusahaan terdaftar.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-[#262626] rounded-xl divide-y divide-[#262626]">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#181818] transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#f3f5f7]">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          /{c.slug} · {c.allowedDomains.join(", ")}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                        {c.members > 0 ? `${c.members} ANGGOTA` : "TERSEDIA"}
                      </span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="px-4 py-4 text-xs text-neutral-400">
                      Tidak ditemukan hasil untuk &quot;{search}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selected && !requestId && (
            <div>
              <div className="label mb-3">LANGKAH 02 — EMAIL KANTOR</div>
              <div className="card bg-[#181818] p-3.5 mb-4 border-[#262626] flex items-center gap-3 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#f3f5f7]">
                    {selected.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    DOMAIN DIIZINKAN: {selected.allowedDomains.join(" · ")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    setSelected(null);
                    setError(null);
                  }}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  ← Ganti Perusahaan
                </button>
                <button
                  onClick={() => void handleDirectJoin(selected.slug)}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Masuk Tanpa Verifikasi →
                </button>
              </div>

              <input
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="input mb-4 text-xs"
                type="email"
              />
              <button
                onClick={() => void requestOtp()}
                disabled={busy || !workEmail.includes("@")}
                className="btn btn-primary w-full py-3"
              >
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> MENGIRIM OTP...
                  </span>
                ) : (
                  "KIRIM KODE VERIFIKASI"
                )}
              </button>
            </div>
          )}

          {selected && requestId && (
            <div>
              <div className="label mb-3">LANGKAH 03 — MASUKKAN 6 DIGIT OTP</div>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Kode OTP telah dikirim ke email kantor. Berlaku selama 15 menit.
              </p>
              <input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ""))
                }
                maxLength={6}
                placeholder="000000"
                className="input font-mono tracking-[0.6em] text-center text-lg mb-4"
              />
              <button
                onClick={() => void confirmOtp()}
                disabled={busy || otp.length < 6}
                className="btn btn-primary w-full py-3"
              >
                {busy
                  ? "MEMVERIFIKASI..."
                  : `VERIFIKASI & MASUK ${selected.name.toUpperCase()}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode: Direct Join */}
      {mode === "direct" && (
        <div className="card p-6 border-line space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs leading-relaxed">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Mode Masuk Langsung (Unverified)</p>
              <p className="mt-1 text-neutral-400">
                Kamu dapat langsung melihat feed, berkomentar, dan membuat thread tanpa verifikasi email atau secret code. Setiap aktivitasmu akan diberi badge &quot;Unverified&quot;. Kamu tetap bisa memverifikasi akun kapan saja di halaman perusahaan.
              </p>
            </div>
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pilih perusahaan yang ingin dikunjungi..."
              className="input pl-9 text-xs"
            />
          </div>

          <div className="max-h-72 overflow-y-auto border border-[#262626] rounded-xl divide-y divide-[#262626]">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#181818] transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#f3f5f7]">
                    {c.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    /{c.slug}
                  </span>
                </div>
                <button
                  onClick={() => void handleDirectJoin(c.slug)}
                  disabled={busy}
                  className="rounded-full bg-white text-black font-semibold text-xs px-3.5 py-1.5 hover:bg-neutral-200 disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
                >
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                  Masuk Komunitas
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-4 text-xs text-neutral-400">
                Tidak ada perusahaan yang cocok.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing Memberships */}
      {user && user.memberships.length > 0 && (
        <div className="mt-8">
          <div className="label mb-3">KOMUNITAS YANG SUDAH KAMU IKUTI</div>
          <div className="card border-line divide-y divide-[#262626] rounded-xl overflow-hidden">
            {user.memberships.map((m) => (
              <Link
                key={m.company.slug}
                href={`/c/${m.company.slug}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#181818] transition-colors"
              >
                <span className="text-xs font-semibold text-[#f3f5f7]">
                  {m.company.name}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      m.status === "VERIFIED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {m.status === "VERIFIED" ? "Terverifikasi" : "Unverified"}
                  </span>
                  <span className="text-neutral-400 text-xs">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
