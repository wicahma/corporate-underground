'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Shell } from '@/components/Shell';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Shell>
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="card p-8 border-line animate-pulse">
            <div className="h-4 bg-panel2 w-1/3 mb-2" />
            <div className="h-3 bg-panel2 w-2/3" />
          </div>
        </div>
      </Shell>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<'validating' | 'valid' | 'invalid'>('validating');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    const validate = async () => {
      if (!token) {
        if (active) setStatus('invalid');
        return;
      }
      try {
        await authApi.validateResetToken(token);
        if (active) setStatus('valid');
      } catch {
        if (active) setStatus('invalid');
      }
    };
    void validate();
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter');
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="card p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
            <p className="text-sm text-neutral-400">
              Buat kata sandi baru untuk akunmu.
            </p>
          </div>

          {status === 'validating' && (
            <div className="py-8 text-center text-sm text-neutral-400">
              <div className="w-6 h-6 border-2 border-neutral-600 border-t-white rounded-full animate-spin mx-auto mb-3" />
              Memvalidasi token...
            </div>
          )}

          {status === 'invalid' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300 font-medium mb-1">
                    Token tidak valid atau telah kedaluwarsa
                  </p>
                  <p className="text-xs text-neutral-400">
                    Link reset hanya berlaku selama 1 jam. Silakan minta link reset baru.
                  </p>
                </div>
              </div>
              <Link
                href="/forgot-password"
                className="block w-full btn btn-primary text-center"
              >
                Minta Link Baru
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Login
              </Link>
            </div>
          )}

          {status === 'valid' && (
            success ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-300 font-medium mb-1">
                      Kata sandi berhasil diubah
                    </p>
                    <p className="text-xs text-neutral-400">
                      Mengarahkan ke halaman login...
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <div>
                  <label className="label block mb-1.5">KATA SANDI BARU</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    required
                    minLength={8}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label block mb-1.5">KONFIRMASI KATA SANDI</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    required
                    minLength={8}
                    className="input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </Shell>
  );
}