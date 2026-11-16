import React, { useState, useEffect } from 'react';
import { X, Check, UserPlus, Palette, Clock, Plus, Trash2, Briefcase } from 'lucide-react';
import { Collaborator, Demand, FREQUENCIES, Frequency } from '../types';
import { calculateDuration } from '../utils';

export interface ModalFunctionItem {
  id?: string;
  a: string;
  horaInicio: string;
  horaFim: string;
  f: Frequency | string;
}

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaboratorToEdit: { index: number; data: Collaborator } | null;
  collaboratorDemands?: Demand[];
  onSave: (
    collaboratorData: Omit<Collaborator, 'id'>,
    editIndex?: number,
    functionsList?: ModalFunctionItem[]
  ) => void;
}

const COLOR_PRESETS = [
  '#1e7fd8', // Blue
  '#8a4fd1', // Purple
  '#f2760e', // Orange
  '#10a39a', // Teal
  '#e0393e', // Red
  '#2e9e5b', // Green
  '#e64980', // Pink
  '#4c6ef5', // Indigo
  '#fab005', // Yellow
  '#0d3b73', // Navy
];

export const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  isOpen,
  onClose,
  collaboratorToEdit,
  collaboratorDemands = [],
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#1e7fd8');
  const [functionsList, setFunctionsList] = useState<ModalFunctionItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (collaboratorToEdit) {
      setName(collaboratorToEdit.data.n);
      setDescription(collaboratorToEdit.data.d || '');
      setColor(collaboratorToEdit.data.c || '#1e7fd8');
      setFunctionsList(
        collaboratorDemands.map((d) => ({
          id: d.id,
          a: d.a,
          horaInicio: d.horaInicio || '08:00',
          horaFim: d.horaFim || '12:00',
          f: d.f || 'Diária',
        }))
      );
    } else {
      setName('');
      setDescription('');
      setColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
      setFunctionsList([
        {
          a: '',
          horaInicio: '08:00',
          horaFim: '12:00',
          f: 'Diária',
        },
      ]);
    }
  }, [collaboratorToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddFunctionRow = () => {
    setFunctionsList((prev) => [
      ...prev,
      {
        a: '',
        horaInicio: '08:00',
        horaFim: '12:00',
        f: 'Diária',
      },
    ]);
  };

  const handleUpdateFunctionRow = (
    idx: number,
    field: keyof ModalFunctionItem,
    value: string
  ) => {
    setFunctionsList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveFunctionRow = (idx: number) => {
    setFunctionsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSyncDescriptionFromFunctions = () => {
    const names = functionsList
      .map((item) => item.a.trim())
      .filter(Boolean);
    if (names.length > 0) {
      setDescription(names.join(', '));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o nome do colaborador.');
      return;
    }

    const validFunctions = functionsList
      .map((item) => ({
        ...item,
        a: item.a.trim(),
        horaInicio: item.horaInicio || '08:00',
        horaFim: item.horaFim || '12:00',
        f: item.f || 'Diária',
      }))
      .filter((item) => item.a.length > 0);

    const finalDescription =
      description.trim() ||
      (validFunctions.length > 0
        ? validFunctions.map((item) => item.a).join(', ')
        : 'Atividades e responsabilidades');

    onSave(
      {
        n: name.trim(),
        d: finalDescription,
        c: color,
      },
      collaboratorToEdit?.index,
      validFunctions
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d3b73] to-[#1a64b5] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            <h3 className="font-bold text-base">
              {collaboratorToEdit ? 'Editar Colaborador e Funções' : 'Cadastrar Novo Colaborador'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Nome */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome Completo do Colaborador *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo, Mariana Souza..."
                className="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Funções & Horários (Hora Inicial e Hora Final de cada função) */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h4 className="text-xs font-extrabold text-[#0d3b73] dark:text-blue-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Funções & Horários (Início e Término)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Defina a hora inicial e a hora final que o colaborador deve executar cada função.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFunctionRow}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1e6fc4] hover:bg-[#165a9f] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Função</span>
                </button>
              </div>

              {functionsList.length === 0 ? (
                <div className="text-center py-5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Nenhuma função cadastrada para este colaborador ainda.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddFunctionRow}
                    className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    + Adicionar primeira função e horário
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {functionsList.map((fn, idx) => {
                    const duration = calculateDuration(fn.horaInicio, fn.horaFim);
                    return (
                      <div
                        key={fn.id || `new-fn-${idx}`}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-slate-400 w-5 text-center shrink-0">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={fn.a}
                            onChange={(e) => handleUpdateFunctionRow(idx, 'a', e.target.value)}
                            placeholder="Nome da função (ex: Faturamento, Fechamento Noturno...)"
                            className="flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFunctionRow(idx)}
                            title="Remover função"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pl-7 items-end">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                              Hora Inicial
                            </label>
                            <input
                              type="time"
                              value={fn.horaInicio}
                              onChange={(e) => handleUpdateFunctionRow(idx, 'horaInicio', e.target.value)}
                              className="w-full text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                              Hora Final
                            </label>
                            <input
                              type="time"
                              value={fn.horaFim}
                              onChange={(e) => handleUpdateFunctionRow(idx, 'horaFim', e.target.value)}
                              className="w-full text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                              Frequência
                            </label>
                            <select
                              value={fn.f}
                              onChange={(e) => handleUpdateFunctionRow(idx, 'f', e.target.value)}
                              className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                              {FREQUENCIES.map((freq) => (
                                <option key={freq} value={freq}>
                                  {freq}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-between sm:justify-center px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                            <span className="sm:hidden text-[10px] font-sans uppercase text-slate-400">Duração:</span>
                            <span>{duration}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumo / Descrição exibida no Dashboard */}
            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  <span>Resumo das Atividades (Exibido no Card do Painel)</span>
                </label>
                {functionsList.some((f) => f.a.trim()) && (
                  <button
                    type="button"
                    onClick={handleSyncDescriptionFromFunctions}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Preencher com as funções acima
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Faturamento e fechamento noturno (ou deixe em branco para gerar automaticamente)"
                className="w-full text-xs sm:text-sm font-medium px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Cor de Identificação */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-500" />
                <span>Cor de Destaque no Painel</span>
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white dark:bg-slate-900"
                />
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                  {color}
                </span>

                {/* Color Presets */}
                <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setColor(preset)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        color.toLowerCase() === preset.toLowerCase()
                          ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#1e6fc4] hover:bg-[#165a9f] text-white shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{collaboratorToEdit ? 'Salvar Alterações' : 'Cadastrar Colaborador'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
