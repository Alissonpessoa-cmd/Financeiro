import React from 'react';
import { LayoutDashboard, Users, FileEdit, Printer, Plus, CheckCircle2 } from 'lucide-react';
import { Collaborator } from '../types';

export type NavTab = 'dash' | 'realizadas' | 'colab' | 'colabs' | 'ed';

interface NavigationProps {
  activeTab: NavTab;
  activeColabIndex: number | null;
  collaborators: Collaborator[];
  onChangeTab: (tab: NavTab) => void;
  onSelectColabTab: (index: number) => void;
  onOpenNewDemand: () => void;
  onPrint: () => void;
  demandsCount: number;
  completedLogsCount?: number;
  userRole?: 'manager' | 'colab';
  userColabIndex?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  activeColabIndex,
  collaborators,
  onChangeTab,
  onSelectColabTab,
  onOpenNewDemand,
  onPrint,
  demandsCount,
  completedLogsCount = 0,
  userRole = 'manager',
  userColabIndex,
}) => {
  // If user is a collaborator, lock access ONLY to their own tab
  if (userRole === 'colab' && typeof userColabIndex === 'number') {
    const currentColab = collaborators[userColabIndex];

    return (
      <nav className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 bg-slate-200/60 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-300/70 dark:border-slate-700">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0d3b73] text-white shadow-sm">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: currentColab?.c || '#1e7fd8' }}
            />
            <span>Minhas Atividades & Horários · {currentColab?.n || 'Colaborador'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir Minha Rotina</span>
          </button>
        </div>
      </nav>
    );
  }

  // Manager (Alisson): Full access to all tabs
  return (
    <nav className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex flex-col xl:flex-row xl:items-center justify-between gap-3 no-print">
      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-300/70 dark:border-slate-700 overflow-x-auto scrollbar-none max-w-full">
        {/* Painel Geral */}
        <button
          onClick={() => onChangeTab('dash')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'dash'
              ? 'bg-[#0d3b73] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Dash</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono tabular-nums">
            {demandsCount}
          </span>
        </button>

        {/* Atividades Realizadas (Manager History Log) */}
        <button
          onClick={() => onChangeTab('realizadas')}
          title="Relatório completo de atividades concluídas pelos colaboradores, com início, término e duração"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'realizadas'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Atividades Realizadas</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
              activeTab === 'realizadas'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {completedLogsCount}
          </span>
        </button>

        {/* Separator */}
        <span className="h-5 w-px bg-slate-300 dark:bg-slate-700 shrink-0 mx-0.5" />

        {/* Individual Tab for each Collaborator */}
        {collaborators.map((c, idx) => {
          const isSelected = activeTab === 'colab' && activeColabIndex === idx;

          return (
            <button
              key={c.id || idx}
              onClick={() => onSelectColabTab(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-[#0d3b73] text-white shadow-sm ring-1 ring-blue-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: c.c }}
              />
              <span>{c.n}</span>
            </button>
          );
        })}

        {/* Separator */}
        <span className="h-5 w-px bg-slate-300 dark:bg-slate-700 shrink-0 mx-0.5" />

        {/* Equipe Geral Overview Tab */}
        <button
          onClick={() => onChangeTab('colabs')}
          title="Visão geral e cadastro da equipe"
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'colabs'
              ? 'bg-[#0d3b73] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>Equipe Geral</span>
        </button>

        {/* Configurações */}
        <button
          onClick={() => onChangeTab('ed')}
          title="Configurações e textos"
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'ed'
              ? 'bg-[#0d3b73] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Configurações</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        <button
          onClick={onOpenNewDemand}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#1e6fc4] hover:bg-[#165a9f] text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Função / Demanda</span>
        </button>

        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-xs cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Imprimir</span>
        </button>
      </div>
    </nav>
  );
};
