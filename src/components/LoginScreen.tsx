import React, { useState } from 'react';
import { Briefcase, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Collaborator, UserSession } from '../types';

interface LoginScreenProps {
  collaborators: Collaborator[];
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ collaborators, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const normalize = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInputUser = normalize(username);
    const cleanPass = password.trim();

    // 1. Check Manager (Alisson)
    if (
      cleanInputUser === 'alisson' &&
      (cleanPass === 'Financeiro123' || cleanPass === 'Finaceiro123')
    ) {
      const session: UserSession = { name: 'Alisson', role: 'manager' };
      saveSession(session);
      onLoginSuccess(session);
      return;
    }

    // 2. Check Collaborators (Standard password: Financeiro123)
    const matchedIndex = collaborators.findIndex((c) => {
      const normC = normalize(c.n);
      return normC === cleanInputUser || normC.startsWith(cleanInputUser) || cleanInputUser.includes(normC);
    });

    if (
      matchedIndex !== -1 &&
      (cleanPass === 'Financeiro123' || cleanPass === 'Finaceiro123')
    ) {
      const matchedColab = collaborators[matchedIndex];
      const session: UserSession = {
        name: matchedColab.n,
        role: 'colab',
        colabIndex: matchedIndex,
      };
      saveSession(session);
      onLoginSuccess(session);
      return;
    }

    setError('Usuário ou senha incorretos. A senha padrão para colaboradores é: Financeiro123');
  };

  const saveSession = (session: UserSession) => {
    const json = JSON.stringify(session);
    if (rememberMe) {
      localStorage.setItem('painel_fin_logged_in', 'true');
      localStorage.setItem('painel_fin_session', json);
      localStorage.setItem('painel_fin_user', session.name);
    } else {
      sessionStorage.setItem('painel_fin_logged_in', 'true');
      sessionStorage.setItem('painel_fin_session', json);
      sessionStorage.setItem('painel_fin_user', session.name);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071d3d] via-[#0a3266] to-[#124d91] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-7 sm:p-9 text-slate-800 dark:text-slate-100">
          {/* Header Brand */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0a3266] to-[#1e6fc4] text-white shadow-lg shadow-blue-900/30 mb-3.5">
              <Briefcase className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0d3b73] dark:text-blue-300 tracking-tight">
              Acompanhamento de Demandas
            </h1>
            <p className="text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 mt-1">
              Setor Financeiro · Acesso Restrito
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Usuário (Gestor ou Colaborador)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome (ex: Alisson, João Paulo...)"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6fc4]"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6fc4]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#1e6fc4] focus:ring-[#1e6fc4] dark:bg-slate-800 dark:border-slate-700"
                />
                <span>Lembrar meu acesso</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0d3b73] to-[#1e6fc4] hover:from-[#0a2e5c] hover:to-[#175aa3] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>Entrar no Painel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secure badge */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-400 text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sistema Seguro · Acesso dos Colaboradores & Gestão</span>
          </div>
        </div>
      </div>
    </div>
  );
};
