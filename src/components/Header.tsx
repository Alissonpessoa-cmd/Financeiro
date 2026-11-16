import React from 'react';
import { Calendar, Moon, Sun, Briefcase, FileSpreadsheet, User, LogOut } from 'lucide-react';
import { DashboardTexts } from '../types';
import { formatDate } from '../utils';

interface HeaderProps {
  texts: DashboardTexts;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onExportCSV: () => void;
  currentUser?: string;
  onLogout?: () => void;
  selectedDashDate?: string | null;
  isManager?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  texts,
  darkMode,
  onToggleDarkMode,
  onExportCSV,
  currentUser,
  onLogout,
  selectedDashDate,
  isManager = false,
}) => {
  return (
    <header className="bg-gradient-to-r from-[#0a3266] via-[#0d3b73] to-[#1a64b5] text-white px-4 sm:px-6 lg:px-8 py-4 shadow-md no-print transition-colors">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Sector */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
              {texts.titulo || 'ACOMPANHAMENTO DE DEMANDAS'}
            </h1>
            <h2 className="text-sm md:text-base font-semibold text-blue-100 tracking-wide mt-0.5">
              {texts.setor || 'SETOR FINANCEIRO'}
            </h2>
          </div>
        </div>

        {/* Motivational Slogan */}
        <div className="md:border-l border-white/20 md:pl-6 max-w-md hidden lg:block">
          <p className="text-sm italic font-medium text-blue-100/90 leading-snug">
            "{texts.slogan}"
          </p>
        </div>

        {/* Actions & Last Update */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
          <div className="text-left md:text-right bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-white/15">
            <div className="text-xs text-blue-200 flex items-center md:justify-end gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{isManager ? 'Data no Dash:' : 'Atualizado em:'}</span>
            </div>
            <div className="text-sm font-bold text-white tabular-nums tracking-wide">
              {isManager
                ? selectedDashDate
                  ? formatDate(selectedDashDate)
                  : 'Nenhuma'
                : formatDate(texts.data)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCSV}
              title="Exportar planilha CSV"
              className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={onToggleDarkMode}
              title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
              aria-label="Alternar tema escuro/claro"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-200" />}
            </button>

            {currentUser && onLogout && (
              <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                <div className="hidden sm:flex items-center gap-1.5 bg-white/15 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-white/20">
                  <User className="w-3.5 h-3.5 text-blue-200" />
                  <span>{currentUser}</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Sair do sistema"
                  className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-300/30 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-200" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
