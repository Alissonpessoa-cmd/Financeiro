import React from 'react';
import { Collaborator, Demand } from '../types';
import { calculatePercentage } from '../utils';

interface CollaboratorPerformanceProps {
  collaborators: Collaborator[];
  demands: Demand[];
  selectedColabIndex: number | null;
  onSelectColab: (index: number | null) => void;
  onNavigateToProfile?: (index: number) => void;
}

export const CollaboratorPerformance: React.FC<CollaboratorPerformanceProps> = ({
  collaborators,
  demands,
  selectedColabIndex,
  onSelectColab,
  onNavigateToProfile,
}) => {
  const r = 28;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-750 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0d3b73] dark:text-blue-300 tracking-wide">
          Desempenho por Colaborador
        </h3>
        {selectedColabIndex !== null && (
          <button
            onClick={() => onSelectColab(null)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Ver todos
          </button>
        )}
      </div>

      <div className="p-3.5 space-y-2.5">
        {collaborators.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
            Nenhum colaborador cadastrado.
          </div>
        ) : (
          collaborators.map((c, idx) => {
            const memberDemands = demands.filter((d) => d.c === idx);
            const completedCount = memberDemands.filter((d) => d.s === 'conc').length;
            const pendingCount = memberDemands.length - completedCount;
            const pct = calculatePercentage(completedCount, memberDemands.length);
            const isSelected = selectedColabIndex === idx;

            const strokeDashoffset = circumference - (pct / 100) * circumference;

            return (
              <div
                key={c.id || idx}
                onClick={() => onSelectColab(isSelected ? null : idx)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3.5 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-400'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                {/* Ring Gauge */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-16 h-16" viewBox="0 0 70 70">
                    <circle
                      cx="35"
                      cy="35"
                      r={r}
                      fill="none"
                      stroke={`${c.c}25`}
                      strokeWidth="8"
                    />
                    <circle
                      cx="35"
                      cy="35"
                      r={r}
                      fill="none"
                      stroke={c.c}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 35 35)"
                      className="transition-all duration-500 ease-out"
                    />
                    <text
                      x="35"
                      y="40"
                      textAnchor="middle"
                      className="text-xs font-extrabold fill-slate-800 dark:fill-slate-100"
                      style={{ fontSize: '15px' }}
                    >
                      {pct}%
                    </text>
                  </svg>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.c }}
                    />
                    <h4
                      className="text-xs font-extrabold tracking-wide uppercase truncate"
                      style={{ color: c.c }}
                    >
                      {c.n}
                    </h4>
                    {c.jornadaStatus === 'em_andamento' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Em jornada ({c.jornadaInicio})
                      </span>
                    )}
                    {c.jornadaStatus === 'finalizada' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Jornada encerrada ({c.jornadaInicio}-{c.jornadaFim})
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {c.d || 'Sem descrição cadastrada'}
                  </p>
                  <div className="flex items-center justify-between flex-wrap gap-1.5 mt-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <div>
                        <strong className="text-[#2e9e5b] font-bold mr-1 tabular-nums">
                          {completedCount}
                        </strong>
                        Concluídas
                      </div>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <div>
                        <strong className="text-[#d04a1c] font-bold mr-1 tabular-nums">
                          {pendingCount}
                        </strong>
                        Pendentes
                      </div>
                    </div>

                    {onNavigateToProfile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToProfile(idx);
                        }}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                        title="Ver aba individual de horários e funções"
                      >
                        Horários &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
