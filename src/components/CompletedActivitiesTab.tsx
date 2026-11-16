import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Search,
  Download,
  Trash2,
  MessageSquare,
  Timer,
  Users,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Collaborator, CompletedActivityLog, PRIORITY_META } from '../types';
import {
  calculateDuration,
  calculateDurationMinutes,
  exportCompletedLogsToCSV,
  formatDate,
  formatMinutesDuration,
  getTodayYYYYMMDD,
} from '../utils';

interface CompletedActivitiesTabProps {
  logs: CompletedActivityLog[];
  collaborators: Collaborator[];
  onDeleteLog: (logId: string) => void;
  onClearLogs?: () => void;
  selectedDashDate: string | null;
  onSelectDashDate: (date: string | null) => void;
  onNavigateToDash?: () => void;
}

type DateFilterMode = 'all' | 'today' | '7days' | 'custom';

interface ColabDayGroup {
  colabName: string;
  colabColor: string;
  totalMinutes: number;
  items: CompletedActivityLog[];
}

interface DateGroup {
  date: string;
  weekday: string;
  totalActivities: number;
  totalMinutes: number;
  collaborators: ColabDayGroup[];
}

function getWeekdayLabel(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(y, m - 1, d);
  const label = dt.toLocaleDateString('pt-BR', { weekday: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export const CompletedActivitiesTab: React.FC<CompletedActivitiesTabProps> = ({
  logs,
  collaborators,
  onDeleteLog,
  onClearLogs,
  selectedDashDate,
  onSelectDashDate,
  onNavigateToDash,
}) => {
  const [selectedColabName, setSelectedColabName] = useState<string>('all');
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [customDate, setCustomDate] = useState<string>(getTodayYYYYMMDD());
  const [search, setSearch] = useState<string>('');
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});
  const [expandedColabs, setExpandedColabs] = useState<Record<string, boolean>>({});

  const todayStr = getTodayYYYYMMDD();

  // Compute 7 days ago YYYY-MM-DD in local time
  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return getTodayYYYYMMDD(d);
  }, []);

  // Sort newest date first
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const dateCmp = (b.dataConclusao || '').localeCompare(a.dataConclusao || '');
      if (dateCmp !== 0) return dateCmp;
      const startCmp = (a.horaInicio || '').localeCompare(b.horaInicio || '');
      if (startCmp !== 0) return startCmp;
      return (a.horaFim || '').localeCompare(b.horaFim || '');
    });
  }, [logs]);

  // Filter by date and search first for collaborator chip counts
  const dateAndSearchFilteredLogs = useMemo(() => {
    return sortedLogs.filter((log) => {
      if (dateFilterMode === 'today' && log.dataConclusao !== todayStr) return false;
      if (
        dateFilterMode === '7days' &&
        (log.dataConclusao < sevenDaysAgoStr || log.dataConclusao > todayStr)
      ) {
        return false;
      }
      if (dateFilterMode === 'custom' && customDate && log.dataConclusao !== customDate) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (log.colabName || '').toLowerCase().includes(q);
        const matchesActivity = (log.atividade || '').toLowerCase().includes(q);
        const matchesObs = (log.obs || '').toLowerCase().includes(q);
        if (!matchesName && !matchesActivity && !matchesObs) return false;
      }

      return true;
    });
  }, [sortedLogs, dateFilterMode, customDate, search, todayStr, sevenDaysAgoStr]);

  // Final filtered logs including selected collaborator
  const filteredLogs = useMemo(() => {
    if (selectedColabName === 'all') return dateAndSearchFilteredLogs;
    return dateAndSearchFilteredLogs.filter((log) => log.colabName === selectedColabName);
  }, [dateAndSearchFilteredLogs, selectedColabName]);

  // Group first by Date (descending) and inside each Date by Collaborator
  const groupedByDate: DateGroup[] = useMemo(() => {
    const colabOrder = new Map<string, number>();
    collaborators.forEach((c, idx) => colabOrder.set(c.n, idx));

    const dateMap = new Map<string, CompletedActivityLog[]>();
    filteredLogs.forEach((log) => {
      const key = log.dataConclusao || todayStr;
      const list = dateMap.get(key) || [];
      list.push(log);
      dateMap.set(key, list);
    });

    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));

    return sortedDates.map((dateKey) => {
      const dayItems = dateMap.get(dateKey) || [];
      const colabMap = new Map<string, ColabDayGroup>();
      let dayTotalMinutes = 0;

      dayItems.forEach((item) => {
        const name = item.colabName || 'Colaborador';
        const mins =
          typeof item.duracaoMinutos === 'number'
            ? item.duracaoMinutos
            : calculateDurationMinutes(item.horaInicio, item.horaFim);
        dayTotalMinutes += mins;

        const existing = colabMap.get(name) || {
          colabName: name,
          colabColor: item.colabColor || '#1e7fd8',
          totalMinutes: 0,
          items: [],
        };
        existing.totalMinutes += mins;
        existing.items.push(item);
        colabMap.set(name, existing);
      });

      // Sort tasks inside each collaborator chronologically (horaInicio ascending)
      const colabGroups = Array.from(colabMap.values()).map((cg) => ({
        ...cg,
        items: [...cg.items].sort((a, b) => {
          const s = (a.horaInicio || '').localeCompare(b.horaInicio || '');
          if (s !== 0) return s;
          return (a.horaFim || '').localeCompare(b.horaFim || '');
        }),
      }));

      // Sort collaborators in team order, fallback alphabetical
      colabGroups.sort((a, b) => {
        const idxA = colabOrder.has(a.colabName) ? colabOrder.get(a.colabName)! : 999;
        const idxB = colabOrder.has(b.colabName) ? colabOrder.get(b.colabName)! : 999;
        if (idxA !== idxB) return idxA - idxB;
        return a.colabName.localeCompare(b.colabName);
      });

      return {
        date: dateKey,
        weekday: getWeekdayLabel(dateKey),
        totalActivities: dayItems.length,
        totalMinutes: dayTotalMinutes,
        collaborators: colabGroups,
      };
    });
  }, [filteredLogs, collaborators, todayStr]);

  // Aggregate metrics for filtered logs
  const summaryStats = useMemo(() => {
    let totalMinutes = 0;
    const activeColabs = new Set<string>();

    filteredLogs.forEach((log) => {
      const mins =
        typeof log.duracaoMinutos === 'number'
          ? log.duracaoMinutos
          : calculateDurationMinutes(log.horaInicio, log.horaFim);
      totalMinutes += mins;
      if (log.colabName) activeColabs.add(log.colabName);
    });

    const count = filteredLogs.length;
    const avgMinutes = count > 0 ? Math.round(totalMinutes / count) : 0;

    return {
      count,
      totalFormatted: count > 0 ? formatMinutesDuration(totalMinutes) : '0min',
      avgFormatted: count > 0 ? formatMinutesDuration(avgMinutes) : '0min',
      activeColabCount: activeColabs.size,
    };
  }, [filteredLogs]);

  // Per-collaborator breakdown based on current date/search filter
  const collaboratorSummaries = useMemo(() => {
    const map = new Map<string, { name: string; color: string; count: number; minutes: number }>();

    collaborators.forEach((c) => {
      map.set(c.n, { name: c.n, color: c.c, count: 0, minutes: 0 });
    });

    dateAndSearchFilteredLogs.forEach((log) => {
      const key = log.colabName || 'Colaborador';
      const existing = map.get(key) || {
        name: key,
        color: log.colabColor || '#1e7fd8',
        count: 0,
        minutes: 0,
      };
      const mins =
        typeof log.duracaoMinutos === 'number'
          ? log.duracaoMinutos
          : calculateDurationMinutes(log.horaInicio, log.horaFim);
      existing.count += 1;
      existing.minutes += mins;
      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [collaborators, dateAndSearchFilteredLogs]);

  const hasActiveFilters =
    selectedColabName !== 'all' || dateFilterMode !== 'all' || search.trim() !== '';

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  const toggleColabExpand = (dateKey: string, colabName: string) => {
    const key = `${dateKey}::${colabName}`;
    setExpandedColabs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-4">
      {/* 1. Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-900/60 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Atividades Realizadas
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {summaryStats.count}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-900/60 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tempo Total Executado
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {summaryStats.totalFormatted}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-900/60 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tempo Médio / Atividade
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {summaryStats.avgFormatted}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-900/60 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Colaboradores com Entregas
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {summaryStats.activeColabCount}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Per-Collaborator Summary Strip */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0d3b73] dark:text-blue-300 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar por Colaborador</span>
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSelectedColabName('all');
                setDateFilterMode('all');
                setSearch('');
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedColabName('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedColabName === 'all'
                ? 'bg-[#0d3b73] text-white border-[#0d3b73] shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
            }`}
          >
            <span>Todos os Colaboradores</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono tabular-nums ${
                selectedColabName === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {dateAndSearchFilteredLogs.length}
            </span>
          </button>

          {collaboratorSummaries.map((col) => {
            const isSelected = selectedColabName === col.name;
            return (
              <button
                key={col.name}
                type="button"
                onClick={() => setSelectedColabName(isSelected ? 'all' : col.name)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0d3b73] text-white border-[#0d3b73] shadow-xs ring-1 ring-blue-400'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: col.color }}
                />
                <span>{col.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono tabular-nums ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {col.count}
                </span>
                {col.minutes > 0 && (
                  <span
                    className={`text-[11px] font-mono ${
                      isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    ({formatMinutesDuration(col.minutes)})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Log Card (Header + Filters + Grouped Content by Date -> Collaborator) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d3b73] via-[#124d94] to-[#1a64b5] px-5 py-4 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase">
                Atividades Realizadas por Data e Colaborador
              </h2>
              <span className="text-xs bg-white/20 text-white font-mono px-2.5 py-0.5 rounded-full font-bold tabular-nums">
                {filteredLogs.length} {filteredLogs.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-1">
              Organizado primeiro por data e depois por colaborador, exibindo início, término, tempo levado e observações do dia.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => exportCompletedLogsToCSV(filteredLogs)}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Relatório CSV</span>
            </button>

            {onClearLogs && logs.length > 0 && (
              <button
                type="button"
                onClick={onClearLogs}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-rose-600/80 text-white text-xs font-bold border border-white/20 transition-colors cursor-pointer"
                title="Limpar todo o histórico de atividades realizadas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Histórico</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Date Controls */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-750/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por atividade, colaborador ou observação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Period Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Período:
            </span>
            {(
              [
                { key: 'all', label: 'Todas as datas' },
                { key: 'today', label: 'Hoje' },
                { key: '7days', label: 'Últimos 7 dias' },
                { key: 'custom', label: 'Data específica' },
              ] as { key: DateFilterMode; label: string }[]
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setDateFilterMode(opt.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  dateFilterMode === opt.key
                    ? 'bg-[#1e6fc4] text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}

            {dateFilterMode === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        </div>

        {/* Grouped Content: Date -> Collaborator -> Activities */}
        <div className="p-4 space-y-5 bg-slate-50/40 dark:bg-slate-900/20">
          {groupedByDate.length === 0 ? (
            <div className="py-14 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2.5 opacity-30" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Nenhuma atividade concluída encontrada para estes filtros.
              </p>
              <p className="text-xs mt-1">
                Assim que os colaboradores concluírem suas atividades, os registros aparecerão agrupados por data e colaborador.
              </p>
            </div>
          ) : (
            groupedByDate.map((dateGroup) => {
              const isToday = dateGroup.date === todayStr;
              const isCollapsed = Boolean(collapsedDates[dateGroup.date]);
              const isSelectedForDash = selectedDashDate === dateGroup.date;

              return (
                <div
                  key={dateGroup.date}
                  className={`bg-white dark:bg-slate-800 rounded-xl border shadow-xs overflow-hidden transition-all ${
                    isSelectedForDash
                      ? 'border-[#1e6fc4] ring-2 ring-blue-400/40'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Date Header */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleDateCollapse(dateGroup.date)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDateCollapse(dateGroup.date);
                      }
                    }}
                    className={`w-full px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                      isSelectedForDash
                        ? 'bg-blue-50/80 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-950/50'
                        : 'bg-slate-100/90 dark:bg-slate-750 hover:bg-slate-200/60 dark:hover:bg-slate-700/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="w-8 h-8 rounded-lg bg-[#0d3b73] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums">
                          {formatDate(dateGroup.date)}
                        </span>
                        {dateGroup.weekday && (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            · {dateGroup.weekday}
                          </span>
                        )}
                        {isToday && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Hoje
                          </span>
                        )}

                        {/* Botão de Seleção da Data para exibir no Dash */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDashDate(isSelectedForDash ? null : dateGroup.date);
                          }}
                          title={
                            isSelectedForDash
                              ? 'Clique para desmarcar esta data do Dash'
                              : 'Selecionar esta data para exibir no Dash'
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ml-1 ${
                            isSelectedForDash
                              ? 'bg-[#1e6fc4] text-white border-[#1e6fc4] shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-[#1e6fc4] hover:text-[#1e6fc4] dark:hover:text-blue-300'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border ${
                              isSelectedForDash
                                ? 'bg-white text-[#1e6fc4] border-white'
                                : 'border-slate-400 dark:border-slate-500'
                            }`}
                          >
                            {isSelectedForDash && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          <span>{isSelectedForDash ? 'Selecionada no Dash' : 'Exibir no Dash'}</span>
                        </button>

                        {isSelectedForDash && onNavigateToDash && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToDash();
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>Abrir Dash</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {dateGroup.totalActivities}{' '}
                        {dateGroup.totalActivities === 1 ? 'atividade' : 'atividades'}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {dateGroup.collaborators.length}{' '}
                        {dateGroup.collaborators.length === 1 ? 'colaborador' : 'colaboradores'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 font-mono font-extrabold text-indigo-700 dark:text-indigo-300 tabular-nums">
                        <Timer className="w-3.5 h-3.5" />
                        <span>{formatMinutesDuration(dateGroup.totalMinutes)}</span>
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Collaborators within this Date */}
                  {!isCollapsed && (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {dateGroup.collaborators.map((colabGroup) => {
                        const colabKey = `${dateGroup.date}::${colabGroup.colabName}`;
                        const isColabExpanded =
                          Boolean(expandedColabs[colabKey]) || search.trim() !== '';

                        return (
                          <div key={colabKey} className="bg-white dark:bg-slate-800">
                            {/* Collaborator Accordion Button */}
                            <button
                              type="button"
                              onClick={() => toggleColabExpand(dateGroup.date, colabGroup.colabName)}
                              className={`w-full px-4 py-3 border-l-[5px] flex flex-wrap items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                                isColabExpanded
                                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-b border-slate-200/80 dark:border-slate-700/80'
                                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750/60'
                              }`}
                              style={{ borderLeftColor: colabGroup.colabColor || '#1e7fd8' }}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                                  style={{ backgroundColor: colabGroup.colabColor || '#1e7fd8' }}
                                />
                                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                                  {colabGroup.colabName}
                                </h3>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                  {colabGroup.items.length}{' '}
                                  {colabGroup.items.length === 1 ? 'atividade concluída' : 'atividades concluídas'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200/70 dark:border-indigo-800/50">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  <span>Tempo no dia: {formatMinutesDuration(colabGroup.totalMinutes)}</span>
                                </div>
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                                  <span className="hidden sm:inline">
                                    {isColabExpanded ? 'Ocultar' : 'Ver demandas'}
                                  </span>
                                  {isColabExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </span>
                              </div>
                            </button>

                            {/* Collaborator's Activities Table for this Date (Shown only when clicked) */}
                            {isColabExpanded && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 border-b border-slate-200/70 dark:border-slate-700/70 text-[11px]">
                                      <th className="py-2 px-4 font-bold min-w-[240px]">Demanda / Atividade Realizada</th>
                                      <th className="py-2 px-3 font-bold w-28 text-center whitespace-nowrap">Hora Início</th>
                                      <th className="py-2 px-3 font-bold w-28 text-center whitespace-nowrap">Hora Término</th>
                                      <th className="py-2 px-3 font-bold w-32 text-center whitespace-nowrap">Tempo Levado</th>
                                      <th className="py-2 px-3.5 font-bold min-w-[220px]">Observação</th>
                                      <th className="py-2 px-3 font-bold w-14 text-right no-print">Ações</th>
                                    </tr>
                                  </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {colabGroup.items.map((log, idx) => {
                                  const priorityMeta = PRIORITY_META[log.prioridade] || PRIORITY_META.med;
                                  const durationStr =
                                    log.duracao || calculateDuration(log.horaInicio, log.horaFim);

                                  return (
                                    <tr
                                      key={log.id}
                                      className={`hover:bg-slate-50 dark:hover:bg-slate-750/60 transition-colors ${
                                        idx % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/30' : ''
                                      }`}
                                    >
                                      {/* Atividade */}
                                      <td className="py-2.5 px-4">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                          <span className="font-bold text-slate-900 dark:text-white leading-snug">
                                            {log.atividade}
                                          </span>
                                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                            {log.frequencia || 'Diária'}
                                          </span>
                                          <span
                                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                            style={{
                                              backgroundColor: priorityMeta.bg,
                                              color:
                                                priorityMeta.color === '#f0a020'
                                                  ? '#92400e'
                                                  : priorityMeta.color,
                                            }}
                                          >
                                            {priorityMeta.label}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Hora Início */}
                                      <td className="py-2.5 px-3 text-center whitespace-nowrap tabular-nums">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 font-mono font-bold">
                                          <Clock className="w-3 h-3 shrink-0" />
                                          <span>{log.horaInicio || '—'}</span>
                                        </span>
                                      </td>

                                      {/* Hora Término */}
                                      <td className="py-2.5 px-3 text-center whitespace-nowrap tabular-nums">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 font-mono font-bold">
                                          <Clock className="w-3 h-3 shrink-0" />
                                          <span>{log.horaFim || '—'}</span>
                                        </span>
                                      </td>

                                      {/* Tempo Levado */}
                                      <td className="py-2.5 px-3 text-center whitespace-nowrap tabular-nums">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-mono font-extrabold">
                                          <Timer className="w-3.5 h-3.5 shrink-0" />
                                          <span>{durationStr}</span>
                                        </span>
                                      </td>

                                      {/* Observação */}
                                      <td className="py-2.5 px-3.5">
                                        {log.obs ? (
                                          <div className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-700/60">
                                            <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                            <span className="leading-snug">{log.obs}</span>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 dark:text-slate-500">—</span>
                                        )}
                                      </td>

                                      {/* Ações */}
                                      <td className="py-2.5 px-3 text-right whitespace-nowrap no-print">
                                        <button
                                          type="button"
                                          onClick={() => onDeleteLog(log.id)}
                                          title="Remover este registro do histórico"
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                            )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
