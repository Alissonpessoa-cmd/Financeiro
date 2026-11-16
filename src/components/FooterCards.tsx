import React from 'react';
import { Target, Users, Award, Sparkles } from 'lucide-react';
import { DashboardTexts } from '../types';

interface FooterCardsProps {
  texts: DashboardTexts;
}

export const FooterCards: React.FC<FooterCardsProps> = ({ texts }) => {
  return (
    <footer className="mt-5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80 dark:from-slate-800/90 dark:via-slate-800 dark:to-slate-800/90 border border-blue-200/60 dark:border-slate-700/80 rounded-xl p-5 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 items-center">
        {/* Card 1: Foco */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <strong className="block text-xs font-extrabold uppercase text-[#0d3b73] dark:text-blue-300 tracking-wider mb-1">
              {texts.f1t}
            </strong>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {texts.f1}
            </p>
          </div>
        </div>

        {/* Card 2: Juntos */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <strong className="block text-xs font-extrabold uppercase text-[#0d3b73] dark:text-blue-300 tracking-wider mb-1">
              {texts.f2t}
            </strong>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {texts.f2}
            </p>
          </div>
        </div>

        {/* Card 3: Nosso Objetivo */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <strong className="block text-xs font-extrabold uppercase text-[#0d3b73] dark:text-blue-300 tracking-wider mb-1">
              {texts.f3t}
            </strong>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {texts.f3}
            </p>
          </div>
        </div>

        {/* Final Motto / Highlight */}
        <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-3 md:pt-0 md:pl-5 text-center md:text-left flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 hidden lg:block" />
          <em className="not-italic text-sm sm:text-base font-extrabold text-[#1e6fc4] dark:text-blue-400 leading-tight">
            "{texts.f4}"
          </em>
        </div>
      </div>
    </footer>
  );
};
