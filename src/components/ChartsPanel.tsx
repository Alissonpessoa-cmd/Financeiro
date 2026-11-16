import React from 'react';
import { Collaborator, Demand, STATUS_META, PRIORITY_META, StatusKey, PriorityKey } from '../types';
import { calculatePercentage } from '../utils';

interface ChartsPanelProps {
  collaborators: Collaborator[];
  demands: Demand[];
}

export const ChartsPanel: React.FC<ChartsPanelProps> = ({
  collaborators,
  demands,
}) => {
  const tot = demands.length;
  const countStatus = (k: StatusKey) => demands.filter((x) => x.s === k).length;
  const countPriority = (k: PriorityKey) => demands.filter((x) => x.pr === k).length;

  // Donut chart calculations
  const r = 38;
  const L = 2 * Math.PI * r; // ~238.76
  const statusKeys: StatusKey[] = ['conc', 'and', 'nao', 'atr'];

  let cumulativeOffset = 0;
  const donutSegments = statusKeys.map((k) => {
    const n = countStatus(k);
    const meta = STATUS_META[k];
    const segmentLength = tot > 0 ? (L * n) / tot : 0;
    const strokeDashoffset = -cumulativeOffset;
    if (n > 0) {
      cumulativeOffset += segmentLength;
    }
    return {
      key: k,
      meta,
      count: n,
      pct: calculatePercentage(n, tot),
      segmentLength,
      strokeDashoffset,
    };
  });

  // Demand counts per collaborator
  const colabCounts = collaborators.map((_, i) => demands.filter((d) => d.c === i).length);
  const maxColabCount = Math.max(1, ...colabCounts);

  const priorityKeys: PriorityKey[] = ['urg', 'alta', 'med', 'bai'];

  return (
    <div className="space-y-4">
      {/* 1. Status Geral das Demandas (Donut) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-750 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-[#0d3b73] dark:text-blue-300 tracking-wide">
            Status Geral das Demandas
          </h3>
        </div>

        <div className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Background track */}
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="15"
                  className="text-slate-100 dark:text-slate-700"
                />
                {/* Segments */}
                {donutSegments.map(
                  (seg) =>
                    seg.count > 0 && (
                      <circle
                        key={seg.key}
                        cx="50"
                        cy="50"
                        r={r}
                        fill="none"
                        stroke={seg.meta.color}
                        strokeWidth="15"
                        strokeDasharray={`${seg.segmentLength} ${L - seg.segmentLength}`}
                        strokeDashoffset={seg.strokeDashoffset}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-500 ease-out"
                      />
                    )
                )}
                {/* Center text */}
                <text
                  x="50"
                  y="49"
                  textAnchor="middle"
                  className="font-extrabold fill-slate-900 dark:fill-white tabular-nums"
                  style={{ fontSize: '18px' }}
                >
                  {tot}
                </text>
                <text
                  x="50"
                  y="63"
                  textAnchor="middle"
                  className="font-semibold fill-slate-400 dark:fill-slate-400 uppercase tracking-wider"
                  style={{ fontSize: '8px' }}
                >
                  Total
                </text>
              </svg>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full space-y-2 text-xs">
              {donutSegments.map((seg) => (
                <div key={seg.key} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: seg.meta.color }}
                    />
                    <span className="font-semibold">{seg.meta.plural}</span>
                  </div>
                  <div className="font-mono tabular-nums text-slate-500 dark:text-slate-400 font-bold">
                    <span>{seg.count}</span>
                    <span className="text-[11px] font-normal ml-1">({seg.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Demandas por Colaborador (Bar Chart) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-750 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-[#0d3b73] dark:text-blue-300 tracking-wide">
            Demandas por Colaborador
          </h3>
        </div>

        <div className="p-4 space-y-3">
          {collaborators.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-3">Nenhum colaborador</p>
          ) : (
            collaborators.map((c, i) => {
              const count = colabCounts[i] || 0;
              const barWidth = maxColabCount > 0 ? (count / maxColabCount) * 100 : 0;

              return (
                <div key={c.id || i} className="grid grid-cols-[100px_1fr_28px] items-center gap-2.5 text-xs">
                  <span className="truncate font-semibold text-slate-700 dark:text-slate-300" title={c.n}>
                    {c.n}
                  </span>
                  <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-sm overflow-hidden flex items-center">
                    <div
                      className="h-full rounded-sm transition-all duration-500 ease-out"
                      style={{
                        backgroundColor: c.c,
                        width: `${Math.max(4, barWidth)}%`,
                      }}
                    />
                  </div>
                  <b className="text-right tabular-nums text-slate-800 dark:text-slate-200 font-bold">
                    {count}
                  </b>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Prioridades */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-750 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-[#0d3b73] dark:text-blue-300 tracking-wide">
            Prioridades
          </h3>
        </div>

        <div className="p-3.5 space-y-2">
          {priorityKeys.map((k) => {
            const meta = PRIORITY_META[k];
            const count = countPriority(k);

            return (
              <div
                key={k}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  backgroundColor: meta.bg,
                  color: '#14263f',
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span style={{ color: meta.color === '#f0a020' ? '#92400e' : meta.color }}>
                    {meta.label}
                  </span>
                </div>
                <span className="font-mono tabular-nums text-slate-900 bg-white/70 px-2 py-0.5 rounded shadow-2xs">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
