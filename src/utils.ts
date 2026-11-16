import { AppState, CompletedActivityLog, Demand, STATUS_META, PRIORITY_META } from './types';

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
}

export function getTodayYYYYMMDD(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculatePercentage(part: number, total: number): number {
  if (!total || total === 0) return 0;
  return Math.round((part / total) * 100);
}

export function isOverdue(dateStr?: string, status?: string, frequency?: string): boolean {
  if (frequency === 'Diária' || !dateStr || status === 'conc') return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dateStr);
    deadline.setHours(0, 0, 0, 0);
    return deadline < today;
  } catch {
    return false;
  }
}

export function calculateDurationMinutes(horaInicio?: string, horaFim?: string): number {
  if (!horaInicio || !horaFim) return 0;
  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFim.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;

  let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // Crosses midnight
  }
  return diffMinutes;
}

export function formatMinutesDuration(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export function calculateDuration(horaInicio?: string, horaFim?: string): string {
  if (!horaInicio || !horaFim) return '—';
  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFim.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return '—';

  const diffMinutes = calculateDurationMinutes(horaInicio, horaFim);
  return formatMinutesDuration(diffMinutes);
}

export function isCurrentlyActiveTime(horaInicio?: string, horaFim?: string): boolean {
  if (!horaInicio || !horaFim) return false;
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [h1, m1] = horaInicio.split(':').map(Number);
    const [h2, m2] = horaFim.split(':').map(Number);
    const startMinutes = h1 * 60 + m1;
    const endMinutes = h2 * 60 + m2;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Crosses midnight (e.g. 22:00 to 02:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  } catch {
    return false;
  }
}

export function getLatestResetBoundary(now: Date = new Date()): Date {
  const boundary = new Date(now);
  boundary.setHours(7, 0, 0, 0);
  if (now.getHours() < 7) {
    boundary.setDate(boundary.getDate() - 1);
  }
  return boundary;
}

export function isHiddenUntilNextReset(concluidoEm?: string, now: Date = new Date()): boolean {
  if (!concluidoEm) return false;
  try {
    const doneDate = new Date(concluidoEm);
    if (isNaN(doneDate.getTime())) return false;
    return doneDate >= getLatestResetBoundary(now);
  } catch {
    return false;
  }
}

export function exportToCSV(state: AppState) {
  const headers = ['Colaborador', 'Demanda / Atividade', 'Hora Início', 'Hora Fim', 'Duração', 'Frequência', 'Prazo', 'Status', 'Data Conclusão', 'Prioridade', 'Observação'];
  const rows = state.ds.map((d: Demand) => {
    const colab = state.cs[d.c]?.n || 'Desconhecido';
    const status = STATUS_META[d.s]?.label || d.s;
    const priority = PRIORITY_META[d.pr]?.label || d.pr;
    const deadline = d.f === 'Diária' ? 'Por horário (Diária)' : formatDate(d.p);
    const completionDate = d.dataConclusao ? formatDate(d.dataConclusao) : '';
    const duration = calculateDuration(d.horaInicio, d.horaFim);
    const obs = d.obs || '';
    return [
      `"${colab.replace(/"/g, '""')}"`,
      `"${d.a.replace(/"/g, '""')}"`,
      `"${d.horaInicio || ''}"`,
      `"${d.horaFim || ''}"`,
      `"${duration}"`,
      `"${d.f}"`,
      `"${deadline}"`,
      `"${status}"`,
      `"${completionDate}"`,
      `"${priority}"`,
      `"${obs.replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `demandas_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCompletedLogsToCSV(logs: CompletedActivityLog[]) {
  const headers = [
    'Colaborador',
    'Atividade / Demanda Realizada',
    'Data Conclusão',
    'Hora Início',
    'Hora Término',
    'Tempo Levado',
    'Frequência',
    'Prioridade',
    'Observação',
  ];

  const rows = logs.map((log) => {
    const priority = PRIORITY_META[log.prioridade]?.label || log.prioridade;
    return [
      `"${(log.colabName || 'Desconhecido').replace(/"/g, '""')}"`,
      `"${(log.atividade || '').replace(/"/g, '""')}"`,
      `"${formatDate(log.dataConclusao)}"`,
      `"${log.horaInicio || ''}"`,
      `"${log.horaFim || ''}"`,
      `"${log.duracao || calculateDuration(log.horaInicio, log.horaFim)}"`,
      `"${log.frequencia || 'Diária'}"`,
      `"${priority}"`,
      `"${(log.obs || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `atividades_realizadas_${getTodayYYYYMMDD()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(state: AppState) {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `backup_demandas_financeiro_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
