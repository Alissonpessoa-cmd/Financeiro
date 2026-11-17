import { AppState, ClientRecord, Collaborator, ComodatoOperationType, ComodatoRecord, CompletedActivityLog, Demand, DashboardTexts, PriorityKey } from './types';
import { calculateDuration, calculateDurationMinutes, getTodayYYYYMMDD, isHiddenUntilNextReset } from './utils';

export const STORAGE_KEY = 'painel-fin-v1';

export const DEFAULT_TEXTS: DashboardTexts = {
  titulo: 'ACOMPANHAMENTO DE DEMANDAS',
  setor: 'SETOR FINANCEIRO',
  slogan: 'Organização, controle e resultados para um time cada vez mais forte!',
  data: '2026-10-27',
  f1t: 'FOCO',
  f1: 'Cumprir as demandas no prazo, com qualidade e organização.',
  f2t: 'JUNTOS',
  f2: 'Mais organização, mais resultados!',
  f3t: 'NOSSO OBJETIVO',
  f3: 'Um setor financeiro cada vez mais eficiente, com processos bem definidos e sem retrabalho.',
  f4: 'Equipe unida faz a diferença!',
};

export const FIELD_LABELS: Record<keyof DashboardTexts, string> = {
  titulo: 'Título Principal',
  setor: 'Setor / Departamento',
  slogan: 'Frase do Cabeçalho',
  data: 'Data de Atualização',
  f1t: 'Rodapé 1 – Título',
  f1: 'Rodapé 1 – Texto',
  f2t: 'Rodapé 2 – Título',
  f2: 'Rodapé 2 – Texto',
  f3t: 'Rodapé 3 – Título',
  f3: 'Rodapé 3 – Texto',
  f4: 'Frase Final de Destaque',
};

function createLogFromDemand(
  d: Demand,
  cs: Collaborator[],
  fallbackDate: string
): CompletedActivityLog {
  const colab = cs[d.c];
  const hInicio = d.horaInicio || '08:00';
  const hFim = d.horaFim || '12:00';
  const mins = calculateDurationMinutes(hInicio, hFim);
  const dateStr = d.dataConclusao || (d.concluidoEm ? d.concluidoEm.slice(0, 10) : fallbackDate);

  return {
    id: `log-${d.id}-${dateStr}`,
    demandId: d.id,
    colabIndex: d.c,
    colabName: colab?.n || 'Colaborador',
    colabColor: colab?.c || '#1e7fd8',
    atividade: d.a,
    frequencia: d.f || 'Diária',
    prioridade: (d.pr || 'med') as PriorityKey,
    horaInicio: hInicio,
    horaFim: hFim,
    duracao: calculateDuration(hInicio, hFim),
    duracaoMinutos: mins,
    dataConclusao: dateStr,
    concluidoEm: d.concluidoEm || `${dateStr}T${hFim}:00`,
    obs: d.obs || '',
  };
}

export function getSeedData(): AppState {
  const cs: Collaborator[] = [
    {
      id: 'colab-0',
      n: 'João Paulo',
      d: 'Faturamento e fechamento noturno',
      c: '#1e7fd8',
    },
    {
      id: 'colab-1',
      n: 'Maria Cecylia',
      d: 'Fechamento físico, prestação de contas e arquivamento de documentos',
      c: '#8a4fd1',
    },
    {
      id: 'colab-2',
      n: 'David Thyrri',
      d: 'Controle de comodatos, fechamento financeiro (caixa e gestão de pagamentos)',
      c: '#f2760e',
    },
    {
      id: 'colab-3',
      n: 'Ryan Vinicius',
      d: 'Gestão de ativos, comodatos, digitalização de documentos, cadastro de PDV, cobrança e alimentação da planilha de cartão',
      c: '#10a39a',
    },
  ];

  const today = getTodayYYYYMMDD();
  const ds: Demand[] = [
    // João Paulo (c: 0)
    { id: 'dem-0', c: 0, a: 'Faturamento', f: 'Diária', p: '', s: 'conc', pr: 'alta', horaInicio: '08:00', horaFim: '12:00', dataConclusao: today },
    { id: 'dem-1', c: 0, a: 'Fechamento Noturno', f: 'Diária', p: '', s: 'conc', pr: 'alta', horaInicio: '17:00', horaFim: '21:00', dataConclusao: today },

    // Maria Cecylia (c: 1)
    { id: 'dem-2', c: 1, a: 'Fechamento físico', f: 'Diária', p: '', s: 'and', pr: 'alta', horaInicio: '08:00', horaFim: '11:00' },
    { id: 'dem-3', c: 1, a: 'Prestação de contas', f: 'Diária', p: '', s: 'conc', pr: 'med', horaInicio: '13:00', horaFim: '15:30', dataConclusao: today },
    { id: 'dem-4', c: 1, a: 'Arquivamento de documentos', f: 'Semanal', p: '2026-10-28', s: 'and', pr: 'bai', horaInicio: '15:30', horaFim: '17:00' },

    // David Thyrri (c: 2)
    { id: 'dem-5', c: 2, a: 'Controle de comodatos', f: 'Diária', p: '', s: 'conc', pr: 'med', horaInicio: '08:00', horaFim: '11:00', dataConclusao: today },
    { id: 'dem-6', c: 2, a: 'Fechamento financeiro (caixa e gestão de pagamentos)', f: 'Diária', p: '', s: 'and', pr: 'alta', horaInicio: '11:00', horaFim: '14:00' },
    { id: 'dem-7', c: 2, a: 'Gestão de pagamentos', f: 'Diária', p: '', s: 'atr', pr: 'urg', horaInicio: '14:00', horaFim: '17:00' },

    // Ryan Vinicius (c: 3)
    { id: 'dem-8', c: 3, a: 'Comodatos', f: 'Diária', p: '', s: 'and', pr: 'med', horaInicio: '08:00', horaFim: '09:30' },
    { id: 'dem-9', c: 3, a: 'Digitalização de documentos', f: 'Semanal', p: '2026-10-28', s: 'nao', pr: 'bai', horaInicio: '09:30', horaFim: '11:00' },
    { id: 'dem-10', c: 3, a: 'Cadastro de PDV', f: 'Semanal', p: '2026-10-28', s: 'and', pr: 'med', horaInicio: '11:00', horaFim: '13:00' },
    { id: 'dem-11', c: 3, a: 'Cobrança (ligações/monitoramento/negociações)', f: 'Diária', p: '', s: 'and', pr: 'med', horaInicio: '14:00', horaFim: '16:00' },
    { id: 'dem-12', c: 3, a: 'Alimentação da planilha de cartão', f: 'Diária', p: '', s: 'conc', pr: 'alta', horaInicio: '16:00', horaFim: '17:30', dataConclusao: today },
  ];

  const logs: CompletedActivityLog[] = ds
    .filter((d) => d.s === 'conc')
    .map((d) => createLogFromDemand(d, cs, today));

  return {
    t: { ...DEFAULT_TEXTS },
    cs,
    ds,
    logs,
    comodatos: [],
    clients: [],
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getSeedData();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.cs) || !Array.isArray(parsed.ds)) {
      return getSeedData();
    }

    // Ensure ids and valid collaborator indices
    const cs: Collaborator[] = parsed.cs.map((colab: any, idx: number) => ({
      id: colab.id || `colab-${idx}-${Date.now()}`,
      n: colab.n || 'Colaborador',
      d: colab.d || '',
      c: colab.c || '#1e7fd8',
      jornadaStatus: colab.jornadaStatus || 'nao_iniciada',
      jornadaInicio: colab.jornadaInicio || '',
      jornadaFim: colab.jornadaFim || '',
      jornadaData: colab.jornadaData || '',
      historicoJornadas: Array.isArray(colab.historicoJornadas) ? colab.historicoJornadas : [],
    }));

    const existingLogs: CompletedActivityLog[] = Array.isArray(parsed.logs)
      ? parsed.logs.map((log: any, idx: number) => {
          const hInicio = log.horaInicio || '08:00';
          const hFim = log.horaFim || '12:00';
          const mins =
            typeof log.duracaoMinutos === 'number'
              ? log.duracaoMinutos
              : calculateDurationMinutes(hInicio, hFim);
          return {
            id: log.id || `log-${idx}-${Date.now()}`,
            demandId: log.demandId || '',
            colabIndex: typeof log.colabIndex === 'number' ? log.colabIndex : 0,
            colabName: log.colabName || cs[log.colabIndex]?.n || 'Colaborador',
            colabColor: log.colabColor || cs[log.colabIndex]?.c || '#1e7fd8',
            atividade: log.atividade || '',
            frequencia: log.frequencia || 'Diária',
            prioridade: (['urg', 'alta', 'med', 'bai'].includes(log.prioridade) ? log.prioridade : 'med') as PriorityKey,
            horaInicio: hInicio,
            horaFim: hFim,
            duracao: log.duracao || calculateDuration(hInicio, hFim),
            duracaoMinutos: mins,
            dataConclusao: log.dataConclusao || getTodayYYYYMMDD(),
            concluidoEm: log.concluidoEm || new Date().toISOString(),
            obs: log.obs || '',
          };
        })
      : [];

    const mergedLogs = [...existingLogs];
    const today = getTodayYYYYMMDD();

    const ds: Demand[] = parsed.ds.map((dem: any, idx: number) => {
      const freq = dem.f || 'Diária';
      const hasExpiredConclusion =
        Boolean(dem.concluidoEm) && !isHiddenUntilNextReset(dem.concluidoEm);

      const normalizedDemand: Demand = {
        id: dem.id || `dem-${idx}-${Date.now()}`,
        c: typeof dem.c === 'number' ? dem.c : 0,
        a: dem.a || '',
        f: freq,
        p: freq === 'Diária' ? '' : (dem.p || ''),
        s: ['conc', 'and', 'nao', 'atr'].includes(dem.s) ? dem.s : 'nao',
        pr: ['urg', 'alta', 'med', 'bai'].includes(dem.pr) ? dem.pr : 'med',
        horaInicio: dem.horaInicio || '08:00',
        horaFim: dem.horaFim || '12:00',
        obs: dem.obs || '',
        concluidoEm: dem.concluidoEm || '',
        dataConclusao: dem.dataConclusao || '',
      };

      // If it was completed (either still active today OR about to expire at 07:00),
      // make sure it's saved in persistent history logs before resetting for the new day.
      if (normalizedDemand.s === 'conc') {
        const logDate =
          normalizedDemand.dataConclusao ||
          (normalizedDemand.concluidoEm ? normalizedDemand.concluidoEm.slice(0, 10) : today);
        const alreadyLogged = mergedLogs.some(
          (l) => l.demandId === normalizedDemand.id && l.dataConclusao === logDate
        );
        if (!alreadyLogged) {
          mergedLogs.push(createLogFromDemand(normalizedDemand, cs, logDate));
        }
      }

      if (hasExpiredConclusion) {
        return {
          ...normalizedDemand,
          s: 'nao',
          obs: '',
          concluidoEm: '',
          dataConclusao: '',
        };
      }

      return normalizedDemand;
    });

    const comodatos: ComodatoRecord[] = Array.isArray(parsed.comodatos)
      ? parsed.comodatos.map((item: any, idx: number) => ({
          id: item.id || `com-${idx}-${Date.now()}`,
          tipoOperacao: (['Empréstimo', 'Venda', 'Recolha'].includes(item.tipoOperacao)
            ? item.tipoOperacao
            : 'Empréstimo') as ComodatoOperationType,
          mapa: String(item.mapa || ''),
          motorista: String(item.motorista || ''),
          placa: String(item.placa || ''),
          observacao: String(item.observacao || ''),
          data: item.data || today,
          nb: String(item.nb || ''),
          cliente: String(item.cliente || ''),
          quantidade: typeof item.quantidade === 'number' && item.quantidade > 0 ? item.quantidade : 1,
          tipoEquipamento: String(item.tipoEquipamento || ''),
          criadoEm: item.criadoEm || new Date().toISOString(),
        }))
      : [];

    const clients: ClientRecord[] = Array.isArray(parsed.clients)
      ? parsed.clients
          .map((cli: any, idx: number) => ({
            id: cli.id || `cli-${idx}-${Date.now()}`,
            nb: String(cli.nb || '').trim(),
            descricao: String(cli.descricao || '').trim(),
            criadoEm: cli.criadoEm || new Date().toISOString(),
          }))
          .filter((cli: ClientRecord) => cli.nb || cli.descricao)
      : [];

    return {
      t: { ...DEFAULT_TEXTS, ...(parsed.t || {}) },
      cs,
      ds,
      logs: mergedLogs,
      comodatos,
      clients,
    };
  } catch (err) {
    console.error('Failed to parse saved state:', err);
    return getSeedData();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}
