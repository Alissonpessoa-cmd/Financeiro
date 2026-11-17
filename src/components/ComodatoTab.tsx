import React, { useMemo, useRef, useState } from 'react';
import {
  Package,
  Truck,
  Calendar,
  Search,
  Download,
  Trash2,
  Edit3,
  Plus,
  Check,
  X,
  FileText,
  User,
  Car,
  MessageSquare,
  ArrowDownToLine,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import { ClientRecord, ComodatoOperationType, ComodatoRecord } from '../types';
import { exportComodatosToCSV, formatDate, getTodayYYYYMMDD } from '../utils';

interface ComodatoTabProps {
  records: ComodatoRecord[];
  clients?: ClientRecord[];
  onSaveRecord: (data: Omit<ComodatoRecord, 'id' | 'criadoEm'>, editId?: string) => void;
  onDeleteRecord: (id: string) => void;
  onClearRecords?: () => void;
  canDelete?: boolean;
}

const EQUIPMENT_SUGGESTIONS = [
  'Freezer',
  'Mesa/Cadeira',
  'Caixa Térmica',
  'Vasilhame 600 ml',
  'Vasilhame 300 ml',
  'Vasilhame 1L',
];

const OPERATION_BADGE: Record<
  ComodatoOperationType,
  { bg: string; text: string; border: string }
> = {
  Empréstimo: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  Venda: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
  },
  Recolha: {
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
  },
};

export const ComodatoTab: React.FC<ComodatoTabProps> = ({
  records,
  clients = [],
  onSaveRecord,
  onDeleteRecord,
  onClearRecords,
  canDelete = false,
}) => {
  // Step 1: Mapa / Motorista / Placa / Observação / Operação (puxado primeiro)
  const [tipoOperacao, setTipoOperacao] = useState<ComodatoOperationType>('Empréstimo');
  const [mapa, setMapa] = useState('');
  const [motorista, setMotorista] = useState('');
  const [placa, setPlaca] = useState('');
  const [observacao, setObservacao] = useState('');

  // Step 2: Data / NB / Descrição do Cliente / Quantidade / Tipos de Equipamento
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState(getTodayYYYYMMDD());
  const [nb, setNb] = useState('');
  const [cliente, setCliente] = useState('');
  const [autoLinkedNb, setAutoLinkedNb] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [tipoEquipamento, setTipoEquipamento] = useState('');

  const clientsByNb = useMemo(() => {
    const map = new Map<string, ClientRecord>();
    clients.forEach((c) => {
      const key = c.nb.trim().toLowerCase();
      if (key) map.set(key, c);
    });
    return map;
  }, [clients]);

  const handleNbChange = (value: string) => {
    setNb(value);
    const key = value.trim().toLowerCase();
    const matched = key ? clientsByNb.get(key) : undefined;
    if (matched) {
      setCliente(matched.descricao);
      setAutoLinkedNb(matched.nb);
    } else if (autoLinkedNb !== null) {
      setCliente('');
      setAutoLinkedNb(null);
    }
  };

  // Editing & Feedback
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ComodatoOperationType | 'all'>('all');
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'today' | 'custom'>('all');
  const [customDate, setCustomDate] = useState(getTodayYYYYMMDD());

  const todayStr = getTodayYYYYMMDD();

  // Unique previously saved Mapas so user can "puxar" an existing Mapa with 1 click
  const savedMapas = useMemo(() => {
    const map = new Map<
      string,
      { mapa: string; motorista: string; placa: string; observacao: string; tipoOperacao: ComodatoOperationType }
    >();
    records.forEach((r) => {
      const key = r.mapa.trim().toUpperCase();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          mapa: r.mapa,
          motorista: r.motorista,
          placa: r.placa,
          observacao: r.observacao,
          tipoOperacao: r.tipoOperacao,
        });
      }
    });
    return Array.from(map.values());
  }, [records]);

  const handlePullMapa = (info: {
    mapa: string;
    motorista: string;
    placa: string;
    observacao: string;
    tipoOperacao?: ComodatoOperationType;
  }) => {
    setMapa(info.mapa);
    setMotorista(info.motorista);
    setPlaca(info.placa);
    setObservacao(info.observacao);
    if (info.tipoOperacao) setTipoOperacao(info.tipoOperacao);
    setFeedbackMsg(`Mapa "${info.mapa}" puxado para o formulário!`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleClearMapaHeader = () => {
    setMapa('');
    setMotorista('');
    setPlaca('');
    setObservacao('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNb('');
    setCliente('');
    setAutoLinkedNb(null);
    setQuantidade(1);
    setTipoEquipamento('');
  };

  const handleEditRow = (rec: ComodatoRecord) => {
    setEditingId(rec.id);
    setTipoOperacao(rec.tipoOperacao);
    setMapa(rec.mapa);
    setMotorista(rec.motorista);
    setPlaca(rec.placa);
    setObservacao(rec.observacao);
    setData(rec.data || todayStr);
    setNb(rec.nb);
    setCliente(rec.cliente);
    setAutoLinkedNb(null);
    setQuantidade(rec.quantidade || 1);
    setTipoEquipamento(rec.tipoEquipamento);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!mapa.trim()) {
      alert('Informe o número ou código do Mapa primeiro.');
      return;
    }
    if (!motorista.trim()) {
      alert('Informe o nome do Motorista.');
      return;
    }
    if (!cliente.trim()) {
      alert('Informe a Descrição do Cliente.');
      return;
    }
    if (!tipoEquipamento.trim()) {
      alert('Informe o Tipo de Equipamento.');
      return;
    }

    onSaveRecord(
      {
        tipoOperacao,
        mapa: mapa.trim(),
        motorista: motorista.trim(),
        placa: placa.trim().toUpperCase(),
        observacao: observacao.trim(),
        data: data || todayStr,
        nb: nb.trim(),
        cliente: cliente.trim(),
        quantidade: Math.max(1, Number(quantidade) || 1),
        tipoEquipamento: tipoEquipamento.trim(),
      },
      editingId || undefined
    );

    if (editingId) {
      setFeedbackMsg('Registro atualizado com sucesso!');
      setEditingId(null);
    } else {
      setFeedbackMsg(`Lançamento de ${tipoOperacao} salvo! O Mapa "${mapa.trim()}" continua puxado para novos itens.`);
    }
    setTimeout(() => setFeedbackMsg(null), 3000);

    // Clear item-specific fields while keeping Mapa/Motorista/Placa/Obs ready for the next customer/equipment
    setNb('');
    setCliente('');
    setAutoLinkedNb(null);
    setQuantidade(1);
    setTipoEquipamento('');
  };

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const dateCmp = (b.data || '').localeCompare(a.data || '');
      if (dateCmp !== 0) return dateCmp;
      return (b.criadoEm || '').localeCompare(a.criadoEm || '');
    });
  }, [records]);

  const filteredRecords = useMemo(() => {
    return sortedRecords.filter((r) => {
      if (typeFilter !== 'all' && r.tipoOperacao !== typeFilter) return false;
      if (dateFilterMode === 'today' && r.data !== todayStr) return false;
      if (dateFilterMode === 'custom' && customDate && r.data !== customDate) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          r.mapa,
          r.motorista,
          r.placa,
          r.observacao,
          r.nb,
          r.cliente,
          r.tipoEquipamento,
          r.tipoOperacao,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [sortedRecords, typeFilter, dateFilterMode, customDate, search, todayStr]);

  const summary = useMemo(() => {
    let totalEquipamentos = 0;
    let comodatoCount = 0;
    let vendaCount = 0;
    let recolhaCount = 0;

    filteredRecords.forEach((r) => {
      totalEquipamentos += r.quantidade || 0;
      if (r.tipoOperacao === 'Venda') {
        vendaCount += 1;
      } else if (r.tipoOperacao === 'Recolha') {
        recolhaCount += 1;
      } else {
        comodatoCount += 1;
      }
    });

    return {
      totalRegistros: filteredRecords.length,
      comodatoCount,
      vendaCount,
      recolhaCount,
      totalEquipamentos,
    };
  }, [filteredRecords]);

  return (
    <div className="space-y-5">
      {/* 1. Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total de Lançamentos
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {summary.totalRegistros}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-900/60 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Empréstimos
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {summary.comodatoCount}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-900/60 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Vendas
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {summary.vendaCount}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-900/60 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ArrowDownToLine className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recolhas
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {summary.recolhaCount}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-900/60 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Qtd. Total Equipamentos
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {summary.totalEquipamentos}
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-xs underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 2. Form: Step 1 (Puxar Mapa/Motorista/Placa/Obs) + Step 2 (Data/NB/Cliente/Qtd/Equipamento) */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden"
      >
        {/* Form Header */}
        <div className="bg-gradient-to-r from-[#0d3b73] via-[#124d94] to-[#1a64b5] px-5 py-4 text-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-200 shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase">
                {editingId
                  ? 'Editar Registro de Comodato / Venda'
                  : 'Controle de Comodato & Venda'}
              </h2>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              1º Puxe ou preencha os dados do Mapa (Motorista, Placa e Observação) e depois informe os dados de Data, NB, Cliente e Equipamento.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar Edição</span>
            </button>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* PASSO 1: Puxar / Preencher Cabeçalho do Mapa */}
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/25 border border-blue-200/80 dark:border-blue-900/50 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#0d3b73] text-white text-xs font-black flex items-center justify-center shrink-0">
                  1
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0d3b73] dark:text-blue-300 uppercase tracking-wide">
                  Dados do Mapa (Serve para Venda, Comodato e Recolha)
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Pull existing Mapa dropdown */}
                {savedMapas.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <ArrowDownToLine className="w-3.5 h-3.5 text-[#1e6fc4] dark:text-blue-400" />
                    <select
                      value=""
                      onChange={(e) => {
                        const chosen = savedMapas.find((m) => m.mapa === e.target.value);
                        if (chosen) handlePullMapa(chosen);
                      }}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-[#0d3b73] dark:text-blue-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Puxar Mapa já salvo...</option>
                      {savedMapas.map((m) => (
                        <option key={m.mapa} value={m.mapa}>
                          Mapa {m.mapa} · {m.motorista} ({m.placa || 'Sem placa'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(mapa || motorista || placa || observacao) && (
                  <button
                    type="button"
                    onClick={handleClearMapaHeader}
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white underline cursor-pointer"
                  >
                    Novo Mapa
                  </button>
                )}
              </div>
            </div>

            {/* Finalidade: Empréstimo / Venda / Recolha */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Finalidade / Operação *
              </label>
              <div className="inline-flex flex-wrap gap-2">
                {(['Empréstimo', 'Venda', 'Recolha'] as ComodatoOperationType[]).map((op) => {
                  const active = tipoOperacao === op;
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setTipoOperacao(op)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        active
                          ? op === 'Venda'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : op === 'Recolha'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {op}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mapa, Motorista, Placa do Carro, Observação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mapa *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={mapa}
                    onChange={(e) => setMapa(e.target.value)}
                    placeholder="Ex: 1024"
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motorista *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={motorista}
                    onChange={(e) => setMotorista(e.target.value)}
                    placeholder="Nome do motorista"
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Placa do Carro
                </label>
                <div className="relative">
                  <Car className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC-1D23"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observação
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Observações da rota / entrega..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PASSO 2: Data, NB, Descrição do Cliente, Quantidade, Tipos de Equipamento */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                2
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Dados do Cliente, NB &amp; Equipamento
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
              {/* Data */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Data *
                </label>
                <div className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500">
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="flex-1 min-w-0 py-1 text-xs font-mono font-bold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none [&::-webkit-calendar-picker-indicator]:hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const el = dateInputRef.current;
                      if (!el) return;
                      if (typeof el.showPicker === 'function') {
                        try {
                          el.showPicker();
                          return;
                        } catch {}
                      }
                      el.focus();
                      el.click();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0d3b73] dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-extrabold whitespace-nowrap transition-colors cursor-pointer shrink-0"
                  >
                    Puxar data
                  </button>
                </div>
              </div>

              {/* NB */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  NB
                </label>
                <input
                  type="text"
                  list="clients-nb-list"
                  value={nb}
                  onChange={(e) => handleNbChange(e.target.value)}
                  placeholder="Nº do NB"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {clients.length > 0 && (
                  <datalist id="clients-nb-list">
                    {clients.map((cli) => (
                      <option key={cli.id} value={cli.nb}>
                        {cli.nb} - {cli.descricao}
                      </option>
                    ))}
                  </datalist>
                )}
              </div>

              {/* Descrição do Cliente */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Descrição do Cliente *
                  </label>
                  {autoLinkedNb && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                      Vinculado ao NB {autoLinkedNb}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => {
                    setCliente(e.target.value);
                    setAutoLinkedNb(null);
                  }}
                  placeholder="Código / Nome / Razão social do cliente"
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    autoLinkedNb
                      ? 'border-emerald-400 dark:border-emerald-600'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  required
                />
              </div>

              {/* Quantidade de empréstimo ou comodato */}
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 whitespace-nowrap">
                  Qtd. *
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-2.5 py-2 text-xs font-mono font-bold text-center rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Tipos de Equipamento */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Equipamento *
                </label>
                <input
                  type="text"
                  list="equipment-suggestions"
                  value={tipoEquipamento}
                  onChange={(e) => setTipoEquipamento(e.target.value)}
                  placeholder="Ex: Freezer, Mesa/Cadeira, Caixa Térmica..."
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <datalist id="equipment-suggestions">
                  {EQUIPMENT_SUGGESTIONS.map((eq) => (
                    <option key={eq} value={eq} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Quick equipment chips + Submit button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
                  Sugestões:
                </span>
                {EQUIPMENT_SUGGESTIONS.map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => setTipoEquipamento(eq)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      tipoEquipamento === eq
                        ? 'bg-[#0d3b73] text-white border-[#0d3b73]'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all active:scale-[0.98] cursor-pointer shrink-0"
              >
                {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editingId ? 'Salvar Alterações' : `Registrar ${tipoOperacao}`}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* 3. Tabela de Lançamentos de Comodato & Venda */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="bg-slate-100 dark:bg-slate-750 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-extrabold text-[#0d3b73] dark:text-blue-300 uppercase tracking-wide">
              Registros de Empréstimo, Venda &amp; Recolha
            </h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-[#0d3b73] dark:text-blue-300 tabular-nums">
              {filteredRecords.length} {filteredRecords.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => exportComodatosToCSV(filteredRecords)}
              disabled={filteredRecords.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            {canDelete && onClearRecords && records.length > 0 && (
              <button
                type="button"
                onClick={onClearRecords}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Registros</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por mapa, motorista, placa, NB, cliente, equipamento ou observação..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Operation Type Filter */}
            <div className="flex items-center gap-1">
              {(['all', 'Empréstimo', 'Venda', 'Recolha'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    typeFilter === t
                      ? 'bg-[#0d3b73] text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  {t === 'all' ? 'Todos' : t}
                </button>
              ))}
            </div>

            <span className="h-4 w-px bg-slate-300 dark:bg-slate-600 hidden sm:inline" />

            {/* Date Filter */}
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
              {(
                [
                  { key: 'all', label: 'Todas datas' },
                  { key: 'today', label: 'Hoje' },
                  { key: 'custom', label: 'Data' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDateFilterMode(opt.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    dateFilterMode === opt.key
                      ? 'bg-[#1e6fc4] text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-750'
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
                  className="px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0d3b73] text-white border-b border-slate-300 dark:border-slate-700">
                <th className="py-2.5 px-3.5 font-bold whitespace-nowrap">Data</th>
                <th className="py-2.5 px-3 font-bold whitespace-nowrap">Tipo</th>
                <th className="py-2.5 px-3 font-bold whitespace-nowrap">Mapa</th>
                <th className="py-2.5 px-3 font-bold min-w-[150px]">Motorista</th>
                <th className="py-2.5 px-3 font-bold whitespace-nowrap">Placa do Carro</th>
                <th className="py-2.5 px-3 font-bold whitespace-nowrap">NB</th>
                <th className="py-2.5 px-3.5 font-bold min-w-[190px]">Descrição do Cliente</th>
                <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap">Qtd.</th>
                <th className="py-2.5 px-3 font-bold min-w-[150px]">Tipo de Equipamento</th>
                <th className="py-2.5 px-3 font-bold min-w-[170px]">Observação</th>
                <th className="py-2.5 px-3 font-bold text-right whitespace-nowrap no-print">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-14 text-center text-slate-400 dark:text-slate-500">
                    <Package className="w-10 h-10 mx-auto mb-2.5 opacity-30" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      Nenhum registro de comodato ou venda encontrado.
                    </p>
                    <p className="text-xs mt-1">
                      Preencha o Mapa, Motorista, Placa e os dados do cliente/equipamento acima para começar.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const badge = OPERATION_BADGE[rec.tipoOperacao] || OPERATION_BADGE['Empréstimo'];
                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-750/60 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-800/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {formatDate(rec.data)}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {rec.tipoOperacao}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-extrabold text-[#0d3b73] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200/70 dark:border-blue-800/60">
                          {rec.mapa}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">
                        {rec.motorista}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-700 dark:text-slate-300">
                        {rec.placa || '—'}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-700 dark:text-slate-200">
                        {rec.nb || '—'}
                      </td>

                      <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-white">
                        {rec.cliente}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono font-black text-slate-900 dark:text-white tabular-nums">
                        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
                          {rec.quantidade}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-200">
                        {rec.tipoEquipamento}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {rec.observacao || '—'}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap no-print">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handlePullMapa(rec)}
                            title="Puxar este Mapa, Motorista, Placa e Observação para um novo lançamento"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditRow(rec)}
                            title="Editar lançamento"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => onDeleteRecord(rec.id)}
                              title="Excluir lançamento"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
    </div>
  );
};
