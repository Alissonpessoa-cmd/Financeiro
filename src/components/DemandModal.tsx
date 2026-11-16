import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Clock } from 'lucide-react';
import { Collaborator, Demand, Frequency, PriorityKey, StatusKey, FREQUENCIES } from '../types';
import { calculateDuration } from '../utils';

interface DemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  demandToEdit: Demand | null;
  defaultDate: string;
  initialColabIndex?: number;
  onSaveDemand: (demandData: Omit<Demand, 'id'>, editId?: string) => void;
}

export const DemandModal: React.FC<DemandModalProps> = ({
  isOpen,
  onClose,
  collaborators,
  demandToEdit,
  defaultDate,
  initialColabIndex,
  onSaveDemand,
}) => {
  const [colabIndex, setColabIndex] = useState(0);
  const [activity, setActivity] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('Diária');
  const [deadline, setDeadline] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<StatusKey>('nao');
  const [priority, setPriority] = useState<PriorityKey>('med');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('12:00');
  const [obs, setObs] = useState('');

  useEffect(() => {
    if (demandToEdit) {
      setColabIndex(demandToEdit.c);
      setActivity(demandToEdit.a);
      setFrequency(demandToEdit.f as Frequency);
      setDeadline(demandToEdit.p);
      setStatus(demandToEdit.s);
      setPriority(demandToEdit.pr);
      setHoraInicio(demandToEdit.horaInicio || '08:00');
      setHoraFim(demandToEdit.horaFim || '12:00');
      setObs(demandToEdit.obs || '');
    } else {
      setColabIndex(typeof initialColabIndex === 'number' && initialColabIndex >= 0 ? initialColabIndex : 0);
      setActivity('');
      setFrequency('Diária');
      setDeadline(defaultDate || new Date().toISOString().split('T')[0]);
      setStatus('nao');
      setPriority('med');
      setHoraInicio('08:00');
      setHoraFim('12:00');
      setObs('');
    }
  }, [demandToEdit, defaultDate, isOpen, initialColabIndex]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) {
      alert('Por favor, informe a descrição da demanda ou atividade.');
      return;
    }
    if (collaborators.length === 0) {
      alert('Por favor, cadastre ao menos um colaborador primeiro na aba de Preenchimento.');
      return;
    }

    onSaveDemand(
      {
        c: colabIndex,
        a: activity.trim(),
        f: frequency,
        p: frequency === 'Diária' ? '' : deadline,
        s: status,
        pr: priority,
        horaInicio,
        horaFim,
        obs: obs.trim(),
      },
      demandToEdit?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d3b73] to-[#1a64b5] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base">
              {demandToEdit ? 'Editar Demanda' : 'Nova Demanda Financeira'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Collaborator */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Colaborador Responsável *
            </label>
            {collaborators.length === 0 ? (
              <p className="text-xs text-red-500 font-medium">Nenhum colaborador cadastrado!</p>
            ) : (
              <select
                value={colabIndex}
                onChange={(e) => setColabIndex(Number(e.target.value))}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {collaborators.map((c, idx) => (
                  <option key={c.id || idx} value={idx}>
                    {c.n} {c.d ? `(${c.d.slice(0, 30)}...)` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Activity / Demand name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Demanda / Atividade *
            </label>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="Ex: Faturamento diário, Conciliação bancária..."
              className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Frequency & Deadline Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Frequência
              </label>
              <select
                value={frequency}
                onChange={(e) => {
                  const nextFreq = e.target.value as Frequency;
                  setFrequency(nextFreq);
                  if (nextFreq !== 'Diária' && !deadline) {
                    setDeadline(defaultDate || new Date().toISOString().split('T')[0]);
                  }
                }}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Prazo / Data Limite
              </label>
              {frequency === 'Diária' ? (
                <div className="px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/30 text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Sem data prazo (apenas por horário)</span>
                </div>
              ) : (
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          {/* Horários: Início e Fim */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#0d3b73] dark:text-blue-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Horários da Função (Definidos pelo Gestor)</span>
              </span>
              <span className="text-[11px] font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-blue-200 dark:border-slate-700 font-bold text-blue-700 dark:text-blue-300">
                Duração: {calculateDuration(horaInicio, horaFim)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Hora Inicial (Gestor) *
                </label>
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Hora Final (Gestor) *
                </label>
                <input
                  type="time"
                  required
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusKey)}
                className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="nao">❚❚ Não iniciada</option>
                <option value="and">◔ Em andamento</option>
                <option value="conc">✔ Concluída</option>
                <option value="atr">! Atrasada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityKey)}
                className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="urg">Urgente</option>
                <option value="alta">Alta</option>
                <option value="med">Média</option>
                <option value="bai">Baixa</option>
              </select>
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Observação (Opcional)
            </label>
            <input
              type="text"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Anotações ou observações sobre a execução..."
              className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#1e6fc4] hover:bg-[#165a9f] text-white shadow-xs transition-colors"
            >
              {demandToEdit ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{demandToEdit ? 'Salvar Alterações' : 'Cadastrar Demanda'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
