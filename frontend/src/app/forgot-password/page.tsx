'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api';
import { Shell } from '@/components/Shell';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.requestReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim link reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="card p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Lupa Password</h1>
            <p className="text-sm text-neutral-400">
              Masukkan email kamu dan kami akan mengirimkan link untuk reset password.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-300 font-medium mb-1">
                    Link reset password telah dikirim
                  </p>
                  <p className="text-xs text-neutral-400">
                    Jika email terdaftar di sistem kami, kamu akan menerima link reset dalam beberapa menit. Link berlaku selama 1 jam.
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="block w-full btn btn-secondary text-center"
              >
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div>
                <label className="label block mb-1.5">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@perusahaan.com"
                  required
                  className="input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </Shell>
  );
}
