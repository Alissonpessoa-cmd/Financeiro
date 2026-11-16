import React from 'react';
import { Users, CheckCircle2, Clock, PauseCircle, AlertTriangle } from 'lucide-react';
import { Demand, StatusKey } from '../types';
import { calculatePercentage } from '../utils';

interface KpiCardsProps {
  demands: Demand[];
  statusFilter: StatusKey | 'all';
  onSelectStatusFilter: (status: StatusKey | 'all') => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  demands,
  statusFilter,
  onSelectStatusFilter,
}) => {
  const total = demands.length;
  const count = (s: StatusKey) => demands.filter((d) => d.s === s).length;

  const cards: Array<{
    id: StatusKey | 'all';
    label: string;
    count: number;
    pct: number;
    icon: React.ReactNode;
    color: string;
    bgLight: string;
    bgDark: string;
    borderLight: string;
    borderDark: string;
  }> = [
    {
      id: 'all',
      label: 'TOTAL DE DEMANDAS',
      count: total,
      pct: 100,
      icon: <Users className="w-6 h-6 text-white" />,
      color: '#0d3b73',
      bgLight: 'bg-[#e3eefb]',
      bgDark: 'dark:bg-[#132338]',
      borderLight: 'border-[#c5dcf7]',
      borderDark: 'dark:border-[#223e63]',
    },
    {
      id: 'conc',
      label: 'CONCLUÍDAS',
      count: count('conc'),
      pct: calculatePercentage(count('conc'), total),
      icon: <CheckCircle2 className="w-6 h-6 text-white" />,
      color: '#2e9e5b',
      bgLight: 'bg-[#d3efdc]',
      bgDark: 'dark:bg-[#123120]',
      borderLight: 'border-[#a8e2bc]',
      borderDark: 'dark:border-[#1d5236]',
    },
    {
      id: 'and',
      label: 'EM ANDAMENTO',
      count: count('and'),
      pct: calculatePercentage(count('and'), total),
      icon: <Clock className="w-6 h-6 text-white" />,
      color: '#f0a020',
      bgLight: 'bg-[#fdeec8]',
      bgDark: 'dark:bg-[#342611]',
      borderLight: 'border-[#f9dc98]',
      borderDark: 'dark:border-[#5a421b]',
    },
    {
      id: 'nao',
      label: 'NÃO INICIADAS',
      count: count('nao'),
      pct: calculatePercentage(count('nao'), total),
      icon: <PauseCircle className="w-6 h-6 text-white" />,
      color: '#2f7fd0',
      bgLight: 'bg-[#d8e8f9]',
      bgDark: 'dark:bg-[#14263c]',
      borderLight: 'border-[#b4d4f7]',
      borderDark: 'dark:border-[#234268]',
    },
    {
      id: 'atr',
      label: 'ATRASADAS',
      count: count('atr'),
      pct: calculatePercentage(count('atr'), total),
      icon: <AlertTriangle className="w-6 h-6 text-white" />,
      color: '#e0393e',
      bgLight: 'bg-[#fbd9da]',
      bgDark: 'dark:bg-[#361618]',
      borderLight: 'border-[#f7b0b2]',
      borderDark: 'dark:border-[#5c2326]',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((c) => {
        const isSelected = statusFilter === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelectStatusFilter(statusFilter === c.id && c.id !== 'all' ? 'all' : c.id)}
            className={`text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center gap-3 relative cursor-pointer group ${c.bgLight} ${c.bgDark} ${c.borderLight} ${c.borderDark} ${
              isSelected ? 'ring-2 ring-offset-2 ring-[#0d3b73] dark:ring-blue-400 shadow-md' : 'hover:shadow-sm'
            }`}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: c.color }}
            >
              {c.icon}
            </div>
            <div className="min-w-0 flex-1">
              <span
                className="block text-[11px] font-extrabold tracking-wider uppercase truncate"
                style={{ color: c.color }}
              >
                {c.label}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {c.count}
                </span>
                {c.id !== 'all' && (
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                    {c.pct}%
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
