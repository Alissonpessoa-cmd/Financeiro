import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Check,
  Calendar,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Printer,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Collaborator, Demand, StatusKey, PriorityKey, STATUS_META, PRIORITY_META, FREQUENCIES } from '../types';
import { calculateDuration, formatDate, isOverdue, calculatePercentage, isCurrentlyActiveTime, isHiddenUntilNextReset, getTodayYYYYMMDD } from '../utils';

interface CollaboratorProfileTabProps {
  collaborators: Collaborator[];
  demands: Demand[];
  activeColabIndex: number;
  onSelectColabIndex: (index: number) => void;
  onUpdateDemand: (demandId: string, updates: Partial<Demand>) => void;
  onOpenNewDemand: (colabIndex: number) => void;
  onEditDemand: (demand: Demand) => void;
  onDeleteDemand: (demandId: string) => void;
  onEditCollaborator: (index: number, colab: Collaborator) => void;
  onUpdateCollaboratorJornada?: (colabIndex: number, updates: Partial<Collaborator>) => void;
  isManager?: boolean;
}

export const CollaboratorProfileTab: React.FC<CollaboratorProfileTabProps> = ({
  collaborators,
  demands,
  activeColabIndex,
  onSelectColabIndex,
  onUpdateDemand,
  onOpenNewDemand,
  onEditDemand,
  onDeleteDemand,
  onEditCollaborator,
  onUpdateCollaboratorJornada,
  isManager = true,
}) => {
  const [savedFeedbackId, setSavedFeedbackId] = useState<string | null>(null);
  const [showHiddenCompleted, setShowHiddenCompleted] = useState(false);

  const triggerSavedFeedback = (id: string) => {
    setSavedFeedbackId(id);
    setTimeout(() => {
      setSavedFeedbackId((current) => (current === id ? null : current));
    }, 2500);
  };

  const currentColab = collaborators[activeColabIndex] || collaborators[0];
  const colabDemands = demands.filter((d) => d.c === activeColabIndex);

  // Sort demands by start time if available
  const sortedDemands = [...colabDemands].sort((a, b) => {
    const tA = a.horaInicio || '00:00';
    const tB = b.horaInicio || '00:00';
    return tA.localeCompare(tB);
  });

  // Demands hidden until 07:00 AM next day vs visible demands
  const hiddenCompletedDemands = sortedDemands.filter((d) => isHiddenUntilNextReset(d.concluidoEm));
  const visibleDemands = sortedDemands.filter((d) => !isHiddenUntilNextReset(d.concluidoEm));

  const completedCount = colabDemands.filter((d) => d.s === 'conc').length;
  const completionPct = calculatePercentage(completedCount, colabDemands.length);

  // Total allocated minutes
  const totalMinutes = colabDemands.reduce((acc, d) => {
    if (!d.horaInicio || !d.horaFim) return acc;
    const [h1, m1] = d.horaInicio.split(':').map(Number);
    const [h2, m2] = d.horaFim.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return acc;
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return acc + diff;
  }, 0);

  const totalHoursFormatted = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60 > 0 ? `${totalMinutes % 60}min` : ''}`;

  return (
    <div className="space-y-6">
      {/* 1. Sub-Navigation Tabs for Each Collaborator (Only visible for Manager Alisson) */}
      {isManager && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {collaborators.map((c, idx) => {
              const isActive = idx === activeColabIndex;
              const count = demands.filter((d) => d.c === idx).length;

              return (
                <button
                  key={c.id || idx}
                  onClick={() => onSelectColabIndex(idx)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#0d3b73] text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-white/40 shadow-xs"
                    style={{ backgroundColor: c.c }}
                  />
                  <span>{c.n}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Active Collaborator Header Profile Card */}
      {currentColab && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Profile Info */}
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shrink-0"
                style={{ backgroundColor: currentColab.c }}
              >
                {currentColab.n.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentColab.n}
                  </h2>
                  <span
                    className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full text-white shadow-2xs"
                    style={{ backgroundColor: currentColab.c }}
                  >
                    Setor Financeiro
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {currentColab.d || 'Funções e rotinas sob gestão financeira.'}
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                  <span className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900/50">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Carga Programada: {totalHoursFormatted}</span>
                  </span>

                  <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/50">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Conclusão: {completedCount} de {colabDemands.length} ({completionPct}%)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions for this Collaborator (Only Manager can add tasks or edit profile details) */}
            {isManager && (
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button
                  onClick={() => onOpenNewDemand(activeColabIndex)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e6fc4] hover:bg-[#165a9f] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Função / Horário</span>
                </button>

                <button
                  onClick={() => onEditCollaborator(activeColabIndex, currentColab)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-4 h-4 text-slate-500" />
                  <span>Editar Dados</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Visual Timeline of the Day / Schedule Ribbon */}
      {visibleDemands.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-[#0d3b73] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Cronograma de Horários de {currentColab?.n}</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              {isManager ? 'Horários estipulados pela gestão' : 'Seus horários estipulados'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {visibleDemands.map((d) => {
              const activeNow = isCurrentlyActiveTime(d.horaInicio, d.horaFim);
              const duration = calculateDuration(d.horaInicio, d.horaFim);
              const statusMeta = STATUS_META[d.s];

              return (
                <div
                  key={d.id}
                  className={`p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                    activeNow
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-400'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-750/40 hover:bg-white dark:hover:bg-slate-750'
                  }`}
                >
                  {activeNow && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-600 text-white animate-pulse">
                      Em Horário
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>{d.horaInicio || '08:00'} às {d.horaFim || '12:00'}</span>
                    <span className="text-[11px] text-slate-400 font-normal">({duration})</span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mt-2 leading-snug line-clamp-2">
                    {d.a}
                  </h4>

                  {d.obs && (
                    <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-200/70 dark:border-slate-700/60 flex items-start gap-1.5">
                      <MessageSquare className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{d.obs}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {d.f || 'Diária'}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: statusMeta.bg,
                        color: statusMeta.color === '#f0a020' ? '#92400e' : statusMeta.color,
                      }}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Tabela de Gestão de Funções e Horários */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#0d3b73] via-[#124d94] to-[#1a64b5] px-5 py-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold tracking-wide uppercase">
              Quadro de Funções, Prazos & Horários
            </h3>
            <p className="text-xs text-blue-100 mt-1">
              Informe ou ajuste a hora de início e hora de término das atividades para registrar seu cumprimento. As alterações ficam salvas automaticamente.
            </p>
          </div>

          {/* Action Buttons in Header */}
          {isManager && (
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <button
                onClick={() => onOpenNewDemand(activeColabIndex)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors cursor-pointer border border-white/20"
                title="Adicionar nova atividade ao quadro"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Adicionar Função</span>
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3.5 font-bold min-w-[180px]">Função / Atividade</th>
                <th className="py-2.5 px-2.5 font-bold min-w-[210px]">Hora Início</th>
                <th className="py-2.5 px-2.5 font-bold min-w-[210px]">Hora Término</th>
                <th className="py-2.5 px-2 font-bold w-20">Duração</th>
                <th className="py-2.5 px-2.5 font-bold w-24">Frequência</th>
                <th className="py-2.5 px-2.5 font-bold w-28">Prazo</th>
                <th className="py-2.5 px-2.5 font-bold w-36">Status</th>
                <th className="py-2.5 px-2.5 font-bold w-28 whitespace-nowrap">Data Conclusão</th>
                <th className="py-2.5 px-2.5 font-bold w-24">Prioridade</th>
                <th className="py-2.5 px-2.5 font-bold min-w-[210px]">Observação</th>
                <th className="py-2.5 px-2.5 font-bold w-32 text-center">Finalizar</th>
                {isManager && <th className="py-2.5 px-2.5 font-bold w-16 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {colabDemands.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 12 : 11} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold">Nenhuma função ou atividade cadastrada para {currentColab?.n}.</p>
                    <p className="text-xs mt-1">
                      {isManager
                        ? 'Clique em "Nova Função / Horário" para definir as atribuições e horários.'
                        : 'Aguarde o gestor atribuir as rotinas e horários.'}
                    </p>
                  </td>
                </tr>
              ) : visibleDemands.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 12 : 11} className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      Todas as atividades de hoje foram concluídas!
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      As demandas reaparecerão automaticamente às 07:00 de amanhã.
                    </p>
                  </td>
                </tr>
              ) : (
                visibleDemands.map((d, index) => {
                  const statusMeta = STATUS_META[d.s] || STATUS_META.nao;
                  const priorityMeta = PRIORITY_META[d.pr] || PRIORITY_META.med;
                  const duration = calculateDuration(d.horaInicio, d.horaFim);
                  const isLate = isOverdue(d.p, d.s, d.f);
                  const activeNow = isCurrentlyActiveTime(d.horaInicio, d.horaFim);

                  return (
                    <tr
                      key={d.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-750/60 transition-colors ${
                        activeNow ? 'bg-blue-50/30 dark:bg-blue-950/20' : index % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/40' : ''
                      }`}
                    >
                      {/* Atividade */}
                      <td className="py-2 px-3.5 font-semibold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          {activeNow && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" title="Em horário de execução" />
                          )}
                          <span className="leading-snug">{d.a}</span>
                          {savedFeedbackId === d.id && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 px-1.5 py-0.5 rounded-full animate-pulse">
                              <Check className="w-2.5 h-2.5" /> Registrado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hora Início */}
                      <td className="py-2 px-2.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={d.horaInicio || '08:00'}
                            onChange={(e) => {
                              onUpdateDemand(d.id, { horaInicio: e.target.value });
                              triggerSavedFeedback(d.id);
                            }}
                            className="w-24 text-xs font-mono font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer hover:border-blue-400 transition-colors"
                            title="Hora de Início registrada"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              const hh = String(now.getHours()).padStart(2, '0');
                              const mm = String(now.getMinutes()).padStart(2, '0');
                              onUpdateDemand(d.id, {
                                horaInicio: `${hh}:${mm}`,
                                ...(d.s === 'nao' ? { s: 'and' as StatusKey } : {}),
                              });
                              triggerSavedFeedback(d.id);
                            }}
                            title="Clique para registrar a hora atual como início da atividade"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1e6fc4] hover:bg-[#165a9f] text-white text-[11px] font-bold shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>Hora Inicial</span>
                          </button>
                        </div>
                      </td>

                      {/* Hora Final */}
                      <td className="py-2 px-2.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={d.horaFim || '12:00'}
                            onChange={(e) => {
                              onUpdateDemand(d.id, { horaFim: e.target.value });
                              triggerSavedFeedback(d.id);
                            }}
                            className="w-24 text-xs font-mono font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer hover:border-blue-400 transition-colors"
                            title="Hora Final registrada"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              const hh = String(now.getHours()).padStart(2, '0');
                              const mm = String(now.getMinutes()).padStart(2, '0');
                              onUpdateDemand(d.id, {
                                horaFim: `${hh}:${mm}`,
                                s: 'conc' as StatusKey,
                                dataConclusao: d.dataConclusao || getTodayYYYYMMDD(),
                              });
                              triggerSavedFeedback(d.id);
                            }}
                            title="Clique para registrar a hora atual como término da atividade"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>Hora Final</span>
                          </button>
                        </div>
                      </td>

                      {/* Duração */}
                      <td className="py-2 px-2 font-mono font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                        {duration}
                      </td>

                      {/* Frequência */}
                      <td className="py-2 px-2.5">
                        {isManager ? (
                          <select
                            value={d.f}
                            onChange={(e) => {
                              const nextFreq = e.target.value;
                              if (nextFreq === 'Diária') {
                                onUpdateDemand(d.id, { f: nextFreq, p: '' });
                              } else {
                                onUpdateDemand(d.id, {
                                  f: nextFreq,
                                  p: d.p || new Date().toISOString().split('T')[0],
                                });
                              }
                            }}
                            className="w-full text-xs px-1.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                          >
                            {FREQUENCIES.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {d.f || 'Diária'}
                          </span>
                        )}
                      </td>

                      {/* Prazo */}
                      <td className="py-2 px-2.5 tabular-nums whitespace-nowrap">
                        {d.f === 'Diária' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/50"
                            title="Função diária controlada apenas por hora inicial e final"
                          >
                            Por horário
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span
                              className={
                                isLate
                                  ? 'text-red-600 dark:text-red-400 font-bold'
                                  : 'text-slate-700 dark:text-slate-300 font-medium'
                              }
                            >
                              {formatDate(d.p)}
                            </span>
                            {isLate && (
                              <span title="Atrasada!">
                                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status (Colaborador pode atualizar!) */}
                      <td className="py-2 px-2.5">
                        <select
                          value={d.s}
                          onChange={(e) => {
                            const nextStatus = e.target.value as StatusKey;
                            onUpdateDemand(d.id, {
                              s: nextStatus,
                              dataConclusao: nextStatus === 'conc' ? d.dataConclusao || getTodayYYYYMMDD() : '',
                              ...(nextStatus !== 'conc' ? { concluidoEm: '' } : {}),
                            });
                          }}
                          className="w-full text-xs font-bold rounded px-2 py-1 border transition-all cursor-pointer shadow-2xs focus:outline-none"
                          style={{
                            backgroundColor: statusMeta.bg,
                            color: statusMeta.color === '#f0a020' ? '#92400e' : statusMeta.color,
                            borderColor: `${statusMeta.color}40`,
                          }}
                        >
                          <option value="conc">✔ Concluída</option>
                          <option value="and">◔ Em andamento</option>
                          <option value="nao">❚❚ Não iniciada</option>
                          <option value="atr">! Atrasada</option>
                        </select>
                      </td>

                      {/* Data de Conclusão */}
                      <td className="py-2 px-2.5 whitespace-nowrap tabular-nums">
                        {d.dataConclusao ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60"
                            title="Data em que a demanda foi finalizada"
                          >
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{formatDate(d.dataConclusao)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">—</span>
                        )}
                      </td>

                      {/* Prioridade */}
                      <td className="py-2 px-2.5">
                        {isManager ? (
                          <select
                            value={d.pr}
                            onChange={(e) => onUpdateDemand(d.id, { pr: e.target.value as PriorityKey })}
                            className="w-full text-xs font-bold rounded px-1.5 py-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                          >
                            <option value="urg">Urgente</option>
                            <option value="alta">Alta</option>
                            <option value="med">Média</option>
                            <option value="bai">Baixa</option>
                          </select>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded text-[11px] font-bold"
                            style={{ backgroundColor: priorityMeta.bg, color: priorityMeta.color }}
                          >
                            {priorityMeta.label}
                          </span>
                        )}
                      </td>

                      {/* Observação (Colaborador pode escrever ao concluir a atividade) */}
                      <td className="py-2 px-2.5">
                        <div className="relative flex items-center">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                          <input
                            type="text"
                            value={d.obs || ''}
                            onChange={(e) => onUpdateDemand(d.id, { obs: e.target.value })}
                            onBlur={() => {
                              if (d.obs?.trim()) triggerSavedFeedback(d.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            placeholder="Adicionar observação..."
                            title="Escreva uma observação sobre a conclusão desta atividade"
                            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-colors"
                          />
                        </div>
                      </td>

                      {/* Botão Concluído (Oculta atividade até às 07:00 do dia seguinte) */}
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateDemand(d.id, {
                              s: 'conc' as StatusKey,
                              concluidoEm: new Date().toISOString(),
                              dataConclusao: d.dataConclusao || getTodayYYYYMMDD(),
                            });
                          }}
                          title="Marcar atividade como concluída (ela desaparecerá e voltará às 07:00 de amanhã)"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Concluído</span>
                        </button>
                      </td>

                      {/* Ações (Apenas Gestor Alisson pode editar/remover) */}
                      {isManager && (
                        <td className="py-2 px-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditDemand(d)}
                              title="Editar detalhes"
                              className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteDemand(d.id)}
                              title="Remover função"
                              className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé informativo das atividades ocultas até 07:00 de amanhã */}
        {hiddenCompletedDemands.length > 0 && (
          <div className="px-5 py-3 bg-emerald-50/70 dark:bg-emerald-950/30 border-t border-emerald-200/70 dark:border-emerald-900/50">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {hiddenCompletedDemands.length} {hiddenCompletedDemands.length === 1 ? 'atividade concluída hoje' : 'atividades concluídas hoje'} (reaparecem automaticamente às 07:00 de amanhã).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowHiddenCompleted(!showHiddenCompleted)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
              >
                {showHiddenCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showHiddenCompleted ? 'Ocultar concluídas' : 'Ver concluídas de hoje'}</span>
              </button>
            </div>

            {showHiddenCompleted && (
              <div className="mt-3 divide-y divide-emerald-200/50 dark:divide-emerald-900/50 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-900/70 overflow-hidden">
                {hiddenCompletedDemands.map((d) => (
                  <div key={d.id} className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-100">{d.a}</span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        ({d.horaInicio || '08:00'} – {d.horaFim || '12:00'})
                      </span>
                      {(d.dataConclusao || d.concluidoEm) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                          <Calendar className="w-3 h-3" />
                          Finalizada em {formatDate(d.dataConclusao || d.concluidoEm!.slice(0, 10))}
                        </span>
                      )}
                      {d.obs && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          <MessageSquare className="w-3 h-3 text-blue-500" />
                          {d.obs}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateDemand(d.id, { concluidoEm: '' })}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
                    >
                      Reabrir na lista
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
