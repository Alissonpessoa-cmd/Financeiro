import React, { useRef } from 'react';
import { Plus, Trash2, RotateCcw, AlertOctagon, Download, Upload, Check } from 'lucide-react';
import { AppState, Collaborator, Demand, DashboardTexts, FREQUENCIES, STATUS_META, PRIORITY_META, StatusKey, PriorityKey } from '../types';
import { FIELD_LABELS } from '../data';
import { exportToJSON } from '../utils';

interface DataEntryTabProps {
  state: AppState;
  onUpdateText: (key: keyof DashboardTexts, value: string) => void;
  onAddCollaborator: () => void;
  onUpdateCollaborator: (index: number, field: keyof Collaborator, value: string) => void;
  onDeleteCollaborator: (index: number) => void;
  onAddDemand: () => void;
  onUpdateDemand: (index: number, field: keyof Demand, value: any) => void;
  onDeleteDemand: (index: number) => void;
  onResetToSeed: () => void;
  onClearAll: () => void;
  onImportJSON: (imported: AppState) => void;
}

const PRESET_COLORS = [
  '#1e7fd8', '#8a4fd1', '#f2760e', '#10a39a',
  '#e0393e', '#2e9e5b', '#e64980', '#4c6ef5',
  '#fab005', '#15aabf'
];

export const DataEntryTab: React.FC<DataEntryTabProps> = ({
  state,
  onUpdateText,
  onAddCollaborator,
  onUpdateCollaborator,
  onDeleteCollaborator,
  onAddDemand,
  onUpdateDemand,
  onDeleteDemand,
  onResetToSeed,
  onClearAll,
  onImportJSON,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.cs) && Array.isArray(parsed.ds)) {
          onImportJSON(parsed);
          alert('Dados importados com sucesso!');
        } else {
          alert('Arquivo JSON inválido para este painel.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* 1. Textos e Data do Painel */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-750 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-[#0d3b73] dark:text-blue-300 tracking-wide uppercase">
            1. Textos, Informações e Data do Painel
          </h3>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(FIELD_LABELS) as Array<keyof DashboardTexts>).map((key) => {
              const label = FIELD_LABELS[key];
              const isDate = key === 'data';

              return (
                <div key={key} className={key === 'slogan' || key === 'f4' ? 'sm:col-span-2' : ''}>
                  <label
                    htmlFor={`input-${key}`}
                    className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
                  >
                    {label}
                  </label>
                  <input
                    id={`input-${key}`}
                    type={isDate ? 'date' : 'text'}
                    value={state.t[key] || ''}
                    onChange={(e) => onUpdateText(key, e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Colaboradores */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-750 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0d3b73] dark:text-blue-300 tracking-wide uppercase">
            2. Equipe / Colaboradores ({state.cs.length})
          </h3>
          <button
            onClick={onAddCollaborator}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#1e6fc4] hover:bg-[#165a9f] text-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Colaborador</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-4 font-bold w-12 text-center">#</th>
                <th className="py-2.5 px-4 font-bold min-w-[180px]">Nome</th>
                <th className="py-2.5 px-4 font-bold min-w-[320px]">Atividades & Responsabilidades</th>
                <th className="py-2.5 px-4 font-bold w-36">Cor de Destaque</th>
                <th className="py-2.5 px-4 font-bold w-16 text-center">Remover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {state.cs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nenhum colaborador adicionado. Clique no botão acima para adicionar.
                  </td>
                </tr>
              ) : (
                state.cs.map((colab, idx) => (
                  <tr key={colab.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-750/50">
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={colab.n}
                        onChange={(e) => onUpdateCollaborator(idx, 'n', e.target.value)}
                        placeholder="Nome do colaborador"
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={colab.d}
                        onChange={(e) => onUpdateCollaborator(idx, 'd', e.target.value)}
                        placeholder="Descrição de atividades..."
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={colab.c}
                          onChange={(e) => onUpdateCollaborator(idx, 'c', e.target.value)}
                          className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white dark:bg-slate-900"
                        />
                        <span className="font-mono text-[11px] text-slate-500 uppercase">{colab.c}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => onDeleteCollaborator(idx)}
                        title="Remover colaborador"
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Demandas */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-750 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#0d3b73] dark:text-blue-300 tracking-wide uppercase">
            3. Demandas & Atividades ({state.ds.length})
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={onAddDemand}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#1e6fc4] hover:bg-[#165a9f] text-white rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Demanda</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3 font-bold w-10 text-center">#</th>
                <th className="py-2.5 px-3 font-bold min-w-[140px]">Colaborador</th>
                <th className="py-2.5 px-3 font-bold min-w-[220px]">Demanda / Atividade</th>
                <th className="py-2.5 px-2 font-bold w-24">Início</th>
                <th className="py-2.5 px-2 font-bold w-24">Término</th>
                <th className="py-2.5 px-3 font-bold w-28">Frequência</th>
                <th className="py-2.5 px-3 font-bold w-32">Prazo</th>
                <th className="py-2.5 px-3 font-bold w-36">Status</th>
                <th className="py-2.5 px-3 font-bold w-28">Prioridade</th>
                <th className="py-2.5 px-3 font-bold w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {state.ds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhuma demanda cadastrada.
                  </td>
                </tr>
              ) : (
                state.ds.map((dem, idx) => (
                  <tr key={dem.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-750/50">
                    <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">
                      {idx + 1}
                    </td>

                    {/* Colaborador selector */}
                    <td className="py-2 px-3">
                      <select
                        value={dem.c}
                        onChange={(e) => onUpdateDemand(idx, 'c', Number(e.target.value))}
                        className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        {state.cs.map((c, cIdx) => (
                          <option key={c.id || cIdx} value={cIdx}>
                            {c.n}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Atividade input */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={dem.a}
                        onChange={(e) => onUpdateDemand(idx, 'a', e.target.value)}
                        placeholder="Nome da demanda..."
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Hora Início */}
                    <td className="py-2 px-2">
                      <input
                        type="time"
                        value={dem.horaInicio || '08:00'}
                        onChange={(e) => onUpdateDemand(idx, 'horaInicio', e.target.value)}
                        className="w-full text-xs font-mono font-bold px-1.5 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                        title="Hora de Início"
                      />
                    </td>

                    {/* Hora Fim */}
                    <td className="py-2 px-2">
                      <input
                        type="time"
                        value={dem.horaFim || '12:00'}
                        onChange={(e) => onUpdateDemand(idx, 'horaFim', e.target.value)}
                        className="w-full text-xs font-mono font-bold px-1.5 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                        title="Hora de Término"
                      />
                    </td>

                    {/* Frequência dropdown */}
                    <td className="py-2 px-3">
                      <select
                        value={dem.f}
                        onChange={(e) => {
                          const nextFreq = e.target.value;
                          onUpdateDemand(idx, 'f', nextFreq);
                          if (nextFreq === 'Diária') {
                            onUpdateDemand(idx, 'p', '');
                          } else if (!dem.p) {
                            onUpdateDemand(idx, 'p', state.t.data || new Date().toISOString().split('T')[0]);
                          }
                        }}
                        className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                      >
                        {FREQUENCIES.map((freq) => (
                          <option key={freq} value={freq}>
                            {freq}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Prazo */}
                    <td className="py-2 px-3">
                      {dem.f === 'Diária' ? (
                        <span className="inline-flex items-center px-2.5 py-1.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200/70 dark:border-blue-800/50 whitespace-nowrap">
                          Por horário
                        </span>
                      ) : (
                        <input
                          type="date"
                          value={dem.p}
                          onChange={(e) => onUpdateDemand(idx, 'p', e.target.value)}
                          className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono focus:outline-none cursor-pointer"
                        />
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2 px-3">
                      <select
                        value={dem.s}
                        onChange={(e) => onUpdateDemand(idx, 's', e.target.value as StatusKey)}
                        className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="conc">Concluída</option>
                        <option value="and">Em andamento</option>
                        <option value="nao">Não iniciada</option>
                        <option value="atr">Atrasada</option>
                      </select>
                    </td>

                    {/* Prioridade */}
                    <td className="py-2 px-3">
                      <select
                        value={dem.pr}
                        onChange={(e) => onUpdateDemand(idx, 'pr', e.target.value as PriorityKey)}
                        className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="urg">Urgente</option>
                        <option value="alta">Alta</option>
                        <option value="med">Média</option>
                        <option value="bai">Baixa</option>
                      </select>
                    </td>

                    {/* Delete action */}
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => onDeleteDemand(idx)}
                        title="Remover demanda"
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Global actions bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-750 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onResetToSeed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restaurar Exemplo Padrão</span>
            </button>

            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-100 transition-colors shadow-2xs cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Limpar Tudo</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToJSON(state)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar Backup JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Importar Backup JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
