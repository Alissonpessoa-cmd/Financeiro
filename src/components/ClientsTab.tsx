import React, { useMemo, useRef, useState } from 'react';
import {
  Building2,
  Plus,
  Check,
  X,
  Search,
  Download,
  Trash2,
  Edit3,
  Hash,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import { ClientRecord } from '../types';
import { exportClientsToCSV } from '../utils';

interface ClientsTabProps {
  clients: ClientRecord[];
  onSaveClient: (data: { nb: string; descricao: string }, editId?: string) => void;
  onImportClients: (items: Array<{ nb: string; descricao: string }>) => number;
  onDeleteClient: (id: string) => void;
  onClearClients?: () => void;
  canDelete?: boolean;
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result.map((cell) => cell.replace(/^"+|"+$/g, '').trim());
}

function detectDelimiter(lines: string[]): '\t' | ';' | ',' | null {
  const sample = lines.slice(0, 5);
  const score = (delim: string) =>
    sample.reduce((acc, l) => acc + (l.includes(delim) ? splitDelimitedLine(l, delim).length - 1 : 0), 0);

  if (score('\t') > 0) return '\t';
  if (score(';') > 0) return ';';
  if (score(',') > 0) return ',';
  return null;
}

function normalizeHeaderText(val: string): string {
  return val
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function parseBulkLines(rawText: string): Array<{ nb: string; descricao: string }> {
  const lines = rawText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines);
  const rows: string[][] = lines.map((line) => {
    if (delimiter) {
      return splitDelimitedLine(line, delimiter);
    }
    if (/\s{2,}/.test(line)) {
      return line.split(/\s{2,}/).map((c) => c.trim());
    }
    const match = line.match(/^(\S+)\s+(.+)$/);
    return match ? [match[1].trim(), match[2].trim()] : [line];
  });

  // Detect optional header row and exact column indices for NB & Descrição
  let startIndex = 0;
  let nbColIdx = 0;
  let descColIdx = 1;

  const firstRowNorm = rows[0].map(normalizeHeaderText);
  const foundNbIdx = firstRowNorm.findIndex(
    (h) => h === 'nb' || h === 'cod' || h === 'codigo' || h === 'cod.' || h === 'codigo cliente'
  );
  const foundDescIdx = firstRowNorm.findIndex(
    (h) =>
      h.includes('descri') ||
      h.includes('fantasia') ||
      h.includes('razao') ||
      h === 'cliente' ||
      h === 'nome' ||
      h === 'nome cliente'
  );

  if (foundNbIdx !== -1 && foundDescIdx !== -1 && foundNbIdx !== foundDescIdx) {
    nbColIdx = foundNbIdx;
    descColIdx = foundDescIdx;
    startIndex = 1;
  } else if (
    firstRowNorm.length >= 2 &&
    (firstRowNorm[0] === 'nb' || firstRowNorm[0].includes('cod')) &&
    (firstRowNorm[1].includes('descri') || firstRowNorm[1].includes('cliente') || firstRowNorm[1].includes('nome'))
  ) {
    startIndex = 1;
  }

  const parsed: Array<{ nb: string; descricao: string }> = [];

  for (let i = startIndex; i < rows.length; i++) {
    const cols = rows[i];
    const nb = (cols[nbColIdx] || '').trim();
    const descricao = (cols[descColIdx] || '').trim();

    if (!nb || !descricao) continue;
    parsed.push({ nb, descricao });
  }

  return parsed;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({
  clients,
  onSaveClient,
  onImportClients,
  onDeleteClient,
  onClearClients,
  canDelete = false,
}) => {
  const [nb, setNb] = useState('');
  const [descricao, setDescricao] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [search, setSearch] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNb = nb.trim();
    const cleanDesc = descricao.trim();

    if (!cleanNb) {
      alert('Informe o número NB do cliente.');
      return;
    }
    if (!cleanDesc) {
      alert('Informe a descrição do cliente.');
      return;
    }

    onSaveClient({ nb: cleanNb, descricao: cleanDesc }, editingId || undefined);

    if (editingId) {
      showFeedback(`Cliente NB ${cleanNb} atualizado com sucesso!`);
      setEditingId(null);
    } else {
      showFeedback(`Cliente NB ${cleanNb} cadastrado e pronto para vincular no Comodato!`);
    }

    setNb('');
    setDescricao('');
  };

  const handleEditRow = (cli: ClientRecord) => {
    setEditingId(cli.id);
    setNb(cli.nb);
    setDescricao(cli.descricao);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNb('');
    setDescricao('');
  };

  const handleBulkSubmit = () => {
    const items = parseBulkLines(bulkText);
    if (items.length === 0) {
      alert(
        'Nenhum cliente válido identificado. Use o modelo: NB seguido da Descrição (ex: 1   Conv Gratidao).'
      );
      return;
    }
    const count = onImportClients(items);
    setBulkText('');
    setShowBulkImport(false);
    showFeedback(`${count} ${count === 1 ? 'cliente importado' : 'clientes importados'} com sucesso!`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const buffer = ev.target?.result;
      if (!(buffer instanceof ArrayBuffer)) return;

      let content = new TextDecoder('utf-8').decode(buffer);
      if (content.includes('\uFFFD')) {
        content = new TextDecoder('iso-8859-1').decode(buffer);
      }

      if (!content.trim()) return;
      const items = parseBulkLines(content);
      if (items.length === 0) {
        setBulkText(content);
        setShowBulkImport(true);
        alert('Confira os dados colados no campo de importação e ajuste o formato.');
        return;
      }
      const count = onImportClients(items);
      showFeedback(`${count} ${count === 1 ? 'cliente importado' : 'clientes importados'} do arquivo!`);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const sortedAndFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? clients.filter(
          (c) =>
            c.nb.toLowerCase().includes(q) || c.descricao.toLowerCase().includes(q)
        )
      : [...clients];

    return filtered.sort((a, b) =>
      a.nb.localeCompare(b.nb, 'pt-BR', { numeric: true, sensitivity: 'base' })
    );
  }, [clients, search]);

  return (
    <div className="space-y-5">
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

      {/* 1. Cadastro Individual + Importação em Massa */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#0d3b73] via-[#124d94] to-[#1a64b5] px-5 py-4 text-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-200 shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase">
                {editingId ? 'Editar Cliente (NB)' : 'Cadastro de Clientes (NB / Descrição)'}
              </h2>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              Cadastre o número do cliente (NB) e sua descrição para preenchimento automático na aba Comodato.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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

            <button
              type="button"
              onClick={() => setShowBulkImport((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{showBulkImport ? 'Fechar Importação' : 'Colar do Excel / Planilha'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar CSV</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            {/* NB */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                NB (Número do Cliente) *
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={nb}
                  onChange={(e) => setNb(e.target.value)}
                  placeholder="Ex: 1"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Descrição do Cliente *
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Conv Gratidao"
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Submit */}
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
              </button>
            </div>
          </div>

          {/* Bulk Paste Panel */}
          {showBulkImport && (
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-extrabold text-[#0d3b73] dark:text-blue-300 uppercase">
                    Importar vários clientes (Copiar e colar do Excel)
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Copie as duas colunas (NB e Descrição) direto da sua planilha e cole abaixo. Exemplo:
                    <span className="font-mono ml-1 font-bold">1  Conv Gratidao</span>
                  </p>
                </div>
              </div>

              <textarea
                rows={5}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'1\tConv Gratidao\n2\tBOX SAO PEDRO\n3\tLUCIANOEMARINALVA BE\n4\tBERG TUR e UTILIDADE'}
                className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkText('');
                    setShowBulkImport(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0d3b73] hover:bg-[#092b54] text-white text-xs font-extrabold cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Importar Lista</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* 2. Tabela de Clientes (Modelo NB / Descrição) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="bg-slate-100 dark:bg-slate-750 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-extrabold text-[#0d3b73] dark:text-blue-300 uppercase tracking-wide">
              Clientes Cadastrados (NB / Descrição)
            </h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-[#0d3b73] dark:text-blue-300 tabular-nums">
              {sortedAndFiltered.length} {sortedAndFiltered.length === 1 ? 'cliente' : 'clientes'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => exportClientsToCSV(sortedAndFiltered)}
              disabled={sortedAndFiltered.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            {canDelete && onClearClients && clients.length > 0 && (
              <button
                type="button"
                onClick={onClearClients}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Clientes</span>
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número NB ou descrição do cliente..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0d3b73] text-white border-b border-slate-300 dark:border-slate-700">
                <th className="py-2.5 px-4 font-bold whitespace-nowrap w-36">NB</th>
                <th className="py-2.5 px-4 font-bold">Descrição</th>
                <th className="py-2.5 px-4 font-bold text-right whitespace-nowrap no-print w-28">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {sortedAndFiltered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Building2 className="w-10 h-10 mx-auto mb-2.5 opacity-30" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      Nenhum cliente cadastrado ainda.
                    </p>
                    <p className="text-xs mt-1">
                      Cadastre pelo formulário acima ou cole sua lista do Excel (NB e Descrição).
                    </p>
                  </td>
                </tr>
              ) : (
                sortedAndFiltered.map((cli, idx) => (
                  <tr
                    key={cli.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-750/60 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-800/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-extrabold text-[#0d3b73] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded border border-blue-200/70 dark:border-blue-800/60">
                        {cli.nb}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {cli.descricao}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap no-print">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditRow(cli)}
                          title="Editar cliente"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDeleteClient(cli.id)}
                            title="Excluir cliente"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
