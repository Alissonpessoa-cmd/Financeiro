import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertCircle, Edit3, Trash2, CheckCircle2, Clock, MessageSquare, Calendar } from 'lucide-react';
import { Collaborator, Demand, StatusKey, PriorityKey, STATUS_META, PRIORITY_META } from '../types';
import { formatDate, isOverdue } from '../utils';

interface DemandsTableProps {
  collaborators: Collaborator[];
  demands: Demand[];
  statusFilter: StatusKey | 'all';
  selectedColabIndex: number | null;
  onUpdateDemandStatus: (demandId: string, status: StatusKey) => void;
  onEditDemand: (demand: Demand) => void;
  onDeleteDemand: (demandId: string) => void;
}

export const DemandsTable: React.FC<DemandsTableProps> = ({
  collaborators,
  demands,
  statusFilter,
  selectedColabIndex,
  onUpdateDemandStatus,
  onEditDemand,
  onDeleteDemand,
}) => {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityKey | 'all'>('all');

  const filteredDemands = useMemo(() => {
    return demands.filter((d) => {
      // Status filter
      if (statusFilter !== 'all' && d.s !== statusFilter) return false;

      // Collaborator filter
      if (selectedColabIndex !== null && d.c !== selectedColabIndex) return false;

      // Priority filter
      if (priorityFilter !== 'all' && d.pr !== priorityFilter) return false;

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const colabName = collaborators[d.c]?.n?.toLowerCase() || '';
        const activity = d.a.toLowerCase();
        const frequency = (d.f || '').toLowerCase();
        if (!colabName.includes(query) && !activity.includes(query) && !frequency.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [demands, statusFilter, selectedColabIndex, priorityFilter, search, collaborators]);

  const activeFiltersCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (selectedColabIndex !== null ? 1 : 0) +
    (priorityFilter !== 'all' ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-[#1a64b5] to-[#3b88d0] px-4 py-3 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-extrabold tracking-wide uppercase">
            Demandas em Andamento & Operações
          </h3>
          <span className="text-xs bg-white/20 text-white font-mono px-2 py-0.5 rounded-full font-bold">
            {filteredDemands.length} {filteredDemands.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {/* Priority quick selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-blue-100" />
          <span className="text-blue-100 font-medium hidden sm:inline">Prioridade:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityKey | 'all')}
            className="bg-white/10 text-white border border-white/20 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-white cursor-pointer"
          >
            <option value="all" className="text-slate-900">Todas prioridades</option>
            <option value="urg" className="text-slate-900">Urgente</option>
            <option value="alta" className="text-slate-900">Alta</option>
            <option value="med" className="text-slate-900">Média</option>
            <option value="bai" className="text-slate-900">Baixa</option>
          </select>
        </div>
      </div>

      {/* Search Bar & Active filters bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-750/50 flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por colaborador ou demanda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Filtros ativos:</span>
            {selectedColabIndex !== null && (
              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                {collaborators[selectedColabIndex]?.n}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                {STATUS_META[statusFilter]?.label}
              </span>
            )}
            {priorityFilter !== 'all' && (
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                {PRIORITY_META[priorityFilter]?.label}
              </span>
            )}
            <button
              onClick={() => {
                setSearch('');
                setPriorityFilter('all');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold ml-1 cursor-pointer"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0d3b73] text-white border-b border-slate-300 dark:border-slate-700">
              <th className="py-2.5 px-3 font-bold tracking-wide min-w-[110px]">Colaborador</th>
              <th className="py-2.5 px-3 font-bold tracking-wide min-w-[160px]">Demanda / Atividade</th>
              <th className="py-2.5 px-2 font-bold tracking-wide min-w-[75px]">Frequência</th>
              <th className="py-2.5 px-2 font-bold tracking-wide min-w-[115px] whitespace-nowrap">Horário</th>
              <th className="py-2.5 px-2 font-bold tracking-wide min-w-[95px] whitespace-nowrap">Prazo</th>
              <th className="py-2.5 px-2 font-bold tracking-wide min-w-[115px]">Status</th>
              <th className="py-2.5 px-2 font-bold tracking-wide min-w-[95px] whitespace-nowrap">Data Conclusão</th>
              <th className="py-2.5 px-2 font-bold tracking-wide w-[60px] text-right no-print">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredDemands.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <p className="text-sm font-semibold">Nenhuma demanda encontrada</p>
                  <p className="text-xs mt-1">Ajuste os filtros de busca ou cadastre uma nova demanda.</p>
                </td>
              </tr>
            ) : (
              filteredDemands.map((d, index) => {
                const colab = collaborators[d.c];
                const statusMeta = STATUS_META[d.s] || STATUS_META.nao;
                const priorityMeta = PRIORITY_META[d.pr] || PRIORITY_META.med;
                const overdue = isOverdue(d.p, d.s, d.f);

                return (
                  <tr
                    key={d.id || index}
                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-750/70 ${
                      index % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-800'
                    }`}
                  >
                    {/* Collaborator */}
                    <td className="py-2.5 px-3.5 font-semibold text-slate-800 dark:text-slate-100 border-l-[4px]"
                        style={{ borderLeftColor: colab?.c || '#94a3b8' }}>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: colab?.c || '#94a3b8' }}
                        />
                        <span className="whitespace-nowrap">{colab?.n || '—'}</span>
                      </div>
                    </td>

                    {/* Activity */}
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="leading-snug">{d.a}</span>
                          {/* Priority Badge */}
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm shrink-0"
                            style={{
                              backgroundColor: priorityMeta.bg,
                              color: priorityMeta.color === '#f0a020' ? '#92400e' : priorityMeta.color,
                            }}
                          >
                            {priorityMeta.label}
                          </span>
                        </div>
                        {d.obs && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-700/50 px-2 py-1 rounded mt-1 border border-slate-200/70 dark:border-slate-600/50">
                            <MessageSquare className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{d.obs}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Frequency */}
                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {d.f || '—'}
                      </span>
                    </td>

                    {/* Horário (Start - End for ALL activities) */}
                    <td className="py-2.5 px-2 whitespace-nowrap tabular-nums">
                      <button
                        type="button"
                        onClick={() => onEditDemand(d)}
                        title="Clique para ajustar Hora Inicial e Final"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{d.horaInicio || '08:00'} – {d.horaFim || '12:00'}</span>
                      </button>
                    </td>

                    {/* Prazo (Por horário for Diária, calendar date for periodic tasks) */}
                    <td className="py-2.5 px-2 whitespace-nowrap tabular-nums">
                      {d.f === 'Diária' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300">
                          Por horário
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span
                            className={`font-medium ${
                              overdue
                                ? 'text-red-600 dark:text-red-400 font-bold'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {formatDate(d.p)}
                          </span>
                          {overdue && (
                            <span title="Prazo vencido!">
                              <AlertCircle className="w-3.5 h-3.5 text-red-500 inline" />
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Interactive Status Selector */}
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <select
                        value={d.s}
                        onChange={(e) => onUpdateDemandStatus(d.id, e.target.value as StatusKey)}
                        className="text-xs font-bold rounded-md px-2 py-1 border transition-all cursor-pointer shadow-2xs focus:outline-none w-full max-w-[130px]"
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

                    {/* Data Conclusão */}
                    <td className="py-2.5 px-2 whitespace-nowrap tabular-nums">
                      {d.dataConclusao ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>{formatDate(d.dataConclusao)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-2 text-right whitespace-nowrap no-print">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditDemand(d)}
                          title="Editar demanda"
                          className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteDemand(d.id)}
                          title="Remover demanda"
                          className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
