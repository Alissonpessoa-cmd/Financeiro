import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { Collaborator, Demand } from '../types';
import { calculatePercentage } from '../utils';

interface CollaboratorsTabProps {
  collaborators: Collaborator[];
  demands: Demand[];
  onOpenNewCollaborator: () => void;
  onEditCollaborator: (index: number, colab: Collaborator) => void;
  onDeleteCollaborator: (index: number) => void;
  onSelectColabInDashboard: (index: number) => void;
  onSelectColabProfile: (index: number) => void;
  onAddDemandForColab: (index: number) => void;
}

export const CollaboratorsTab: React.FC<CollaboratorsTabProps> = ({
  collaborators,
  demands,
  onOpenNewCollaborator,
  onEditCollaborator,
  onDeleteCollaborator,
  onSelectColabInDashboard,
  onSelectColabProfile,
  onAddDemandForColab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Overall metrics
  const totalCollaborators = collaborators.length;
  const totalDemands = demands.length;
  const totalCompleted = demands.filter((d) => d.s === 'conc').length;
  const overallCompletionRate = calculatePercentage(totalCompleted, totalDemands);
  const totalDelayed = demands.filter((d) => d.s === 'atr').length;

  const filteredCollaborators = useMemo(() => {
    if (!searchTerm.trim()) return collaborators;
    const term = searchTerm.toLowerCase();
    return collaborators.filter(
      (c) => c.n.toLowerCase().includes(term) || (c.d && c.d.toLowerCase().includes(term))
    );
  }, [collaborators, searchTerm]);

  // Initials helper
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-[#0d3b73] dark:text-blue-300">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40">
              <Users className="w-6 h-6 text-[#1e6fc4]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Cadastro de Colaboradores & Funções
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Gerencie os integrantes do setor financeiro, suas funções, atribuições e distribuição de demandas.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenNewCollaborator}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e6fc4] hover:bg-[#165a9f] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0 active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Colaborador</span>
        </button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total da Equipe
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {totalCollaborators}
            </span>
            <span className="text-xs text-slate-500 font-semibold">colaboradores</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Demandas Alocadas
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {totalDemands}
            </span>
            <span className="text-xs text-slate-500 font-semibold">atividades</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Média de Conclusão</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {overallCompletionRate}%
            </span>
            <span className="text-xs text-slate-500 font-semibold">taxa geral</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-[11px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Demandas Atrasadas</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {totalDelayed}
            </span>
            <span className="text-xs text-slate-500 font-semibold">urgentes</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por colaborador ou função/atribuição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6fc4]"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Exibindo <b>{filteredCollaborators.length}</b> de <b>{totalCollaborators}</b> colaboradores
        </div>
      </div>

      {/* Collaborators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
        {filteredCollaborators.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
              Nenhum colaborador encontrado
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'Tente ajustar sua busca por nome ou função.'
                : 'Cadastre os membros da equipe financeira para acompanhar suas atribuições.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          filteredCollaborators.map((colab) => {
            const originalIndex = collaborators.findIndex((c) => c.id === colab.id);
            const memberDemands = demands.filter((d) => d.c === originalIndex);
            const completedCount = memberDemands.filter((d) => d.s === 'conc').length;
            const inProgressCount = memberDemands.filter((d) => d.s === 'and').length;
            const notStartedCount = memberDemands.filter((d) => d.s === 'nao').length;
            const delayedCount = memberDemands.filter((d) => d.s === 'atr').length;
            const pct = calculatePercentage(completedCount, memberDemands.length);

            return (
              <div
                key={colab.id || originalIndex}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-13 h-13 rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0"
                        style={{ backgroundColor: colab.c }}
                      >
                        {getInitials(colab.n)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                            {colab.n}
                          </h3>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: colab.c }}
                            title={`Cor: ${colab.c}`}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-0.5">
                          Setor Financeiro · Integrante #{originalIndex + 1}
                        </span>
                      </div>
                    </div>

                    {/* Edit & Delete actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditCollaborator(originalIndex, colab)}
                        title="Editar colaborador e funções"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteCollaborator(originalIndex)}
                        title="Remover colaborador"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Funções e Atribuições */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-750/70 border border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0d3b73] dark:text-blue-300">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Funções & Atividades Atribuídas:</span>
                      </div>
                      {colab.jornadaStatus === 'em_andamento' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Em Jornada ({colab.jornadaInicio})
                        </span>
                      )}
                      {colab.jornadaStatus === 'finalizada' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Jornada Concluída ({colab.jornadaInicio}-{colab.jornadaFim})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {colab.d || 'Nenhuma função descrita para este colaborador.'}
                    </p>
                  </div>

                  {/* Progress & Stats */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Progresso das Demandas:
                      </span>
                      <span className="font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                        {completedCount} de {memberDemands.length} ({pct}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: colab.c,
                        }}
                      />
                    </div>

                    {/* Breakdown Badges */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                      <div className="bg-[#d3efdc] dark:bg-[#123120] text-[#2e9e5b] dark:text-[#4ade80] py-1 px-1 rounded-md text-[11px] font-bold">
                        <span className="block text-xs font-mono">{completedCount}</span>
                        <span className="text-[10px]">Concluídas</span>
                      </div>
                      <div className="bg-[#fdeec8] dark:bg-[#342611] text-[#b45309] dark:text-[#fde047] py-1 px-1 rounded-md text-[11px] font-bold">
                        <span className="block text-xs font-mono">{inProgressCount}</span>
                        <span className="text-[10px]">Em andamento</span>
                      </div>
                      <div className="bg-[#d8e8f9] dark:bg-[#14263c] text-[#2563eb] dark:text-[#60a5fa] py-1 px-1 rounded-md text-[11px] font-bold">
                        <span className="block text-xs font-mono">{notStartedCount}</span>
                        <span className="text-[10px]">Não iniciadas</span>
                      </div>
                      <div className="bg-[#fbd9da] dark:bg-[#361618] text-[#dc2626] dark:text-[#f87171] py-1 px-1 rounded-md text-[11px] font-bold">
                        <span className="block text-xs font-mono">{delayedCount}</span>
                        <span className="text-[10px]">Atrasadas</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom / Fast Actions */}
                <div className="p-3 bg-slate-50 dark:bg-slate-750 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectColabProfile(originalIndex)}
                      className="flex items-center gap-1 text-xs font-bold text-white bg-[#0d3b73] hover:bg-[#0a2e5c] transition-colors cursor-pointer py-1.5 px-3 rounded-lg shadow-2xs"
                    >
                      <span>Aba de Horários</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onAddDemandForColab(originalIndex)}
                      className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer py-1.5 px-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nova Função</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectColabInDashboard(originalIndex)}
                    className="flex items-center gap-1 text-xs font-bold text-[#1e6fc4] dark:text-blue-400 hover:underline cursor-pointer py-1 px-2"
                  >
                    <span>Painel</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
