"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, tokenStore } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { Fingerprint, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(email, password);
      const token = (res as Record<string, unknown>).accessToken ?? (res as Record<string, unknown>).token;
      if (token) {
        tokenStore.set(String(token));
        await refresh();
      }
      router.push("/verify");
    } catch (err: unknown) {
      setError((err as Error).message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-sm mx-auto px-4 pt-24 pb-20">
        <div className="card p-8 border-line">
          <div className="mb-8">
            <div className="label mb-2">// FIRST CONTACT</div>
            <h1 className="text-xl font-bold tracking-tight text-fg">
              JOIN THE UNDERGROUND
            </h1>
            <p className="text-[11px] text-dim mt-2 font-mono">
              One account. Many pseudonyms. Zero paper trail between them.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 border border-danger bg-danger/10 text-danger text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div>
              <label className="label block mb-1.5">WORK EMAIL</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input"
              />
            </div>

            <div>
              <label className="label block mb-1.5">PASSWORD</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="input"
              />
            </div>

            <div>
              <label className="label block mb-1.5">CONFIRM PASSWORD</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 mt-2"
            >
              {loading ? "CREATING IDENTITY..." : "CREATE ACCOUNT"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-line flex items-center justify-between">
            <span className="text-[10px] text-dim font-mono flex items-center gap-1.5">
              <Fingerprint className="w-3 h-3" />
              ALREADY IN?
            </span>
            <Link
              href="/login"
              className="text-[10px] uppercase tracking-widest text-fg hover:underline"
            >
              SIGN IN →
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}