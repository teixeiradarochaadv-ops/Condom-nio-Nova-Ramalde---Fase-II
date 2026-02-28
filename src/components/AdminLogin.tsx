import React, { useState } from 'react';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        onLogin();
      } else {
        setError(data.message || 'Password incorreta');
      }
    } catch (err) {
      setError('Erro ao ligar ao servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-600 transition-colors mb-6 text-sm font-medium">
            <ArrowRight size={16} className="rotate-180" />
            Voltar ao Chat
          </Link>
          <div className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Área do Administrador</h1>
          <p className="text-neutral-500 text-sm mt-2">Introduza a password para gerir documentos</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                placeholder="••••••••"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-neutral-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-neutral-200"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
