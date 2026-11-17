export type StatusKey = 'conc' | 'and' | 'nao' | 'atr';
export type PriorityKey = 'urg' | 'alta' | 'med' | 'bai';
export type Frequency = 'Diária' | 'Semanal' | 'Quinzenal' | 'Mensal' | 'Pontual';

export interface JornadaRecord {
  data: string; // YYYY-MM-DD
  inicio: string; // HH:mm
  fim?: string; // HH:mm
  totalHoras?: string; // e.g. "8h 15min"
  status: 'em_andamento' | 'finalizada';
}

export interface Collaborator {
  id: string;
  n: string; // name
  d: string; // description / activities
  c: string; // color hex
  // Controle de Jornada (Ponto)
  jornadaStatus?: 'nao_iniciada' | 'em_andamento' | 'finalizada';
  jornadaInicio?: string; // HH:mm
  jornadaFim?: string;    // HH:mm
  jornadaData?: string;   // YYYY-MM-DD
  historicoJornadas?: JornadaRecord[];
}

export interface Demand {
  id: string;
  c: number; // index of collaborator (or index in array)
  a: string; // activity / demand description
  f: Frequency | string; // frequency
  p: string; // deadline YYYY-MM-DD
  s: StatusKey; // status
  pr: PriorityKey; // priority
  horaInicio?: string; // HH:mm, e.g. "08:00"
  horaFim?: string;    // HH:mm, e.g. "12:00"
  obs?: string;        // observação do colaborador na conclusão da atividade
  concluidoEm?: string; // ISO timestamp when user clicked Concluído button
  dataConclusao?: string; // YYYY-MM-DD local date when demand was finalized
}

export interface CompletedActivityLog {
  id: string;
  demandId: string;
  colabIndex: number;
  colabName: string;
  colabColor: string;
  atividade: string;
  frequencia: string;
  prioridade: PriorityKey;
  horaInicio: string;
  horaFim: string;
  duracao: string;
  duracaoMinutos: number;
  dataConclusao: string; // YYYY-MM-DD
  concluidoEm: string; // ISO timestamp
  obs?: string;
}

export interface UserSession {
  name: string;
  role: 'manager' | 'colab';
  colabIndex?: number;
}

export interface DashboardTexts {
  titulo: string;
  setor: string;
  slogan: string;
  data: string;
  f1t: string;
  f1: string;
  f2t: string;
  f2: string;
  f3t: string;
  f3: string;
  f4: string;
}

export type ComodatoOperationType = 'Empréstimo' | 'Venda' | 'Recolha';

export interface ComodatoRecord {
  id: string;
  tipoOperacao: ComodatoOperationType;
  mapa: string;
  motorista: string;
  placa: string;
  observacao: string;
  data: string; // YYYY-MM-DD
  nb: string;
  cliente: string;
  quantidade: number;
  tipoEquipamento: string;
  criadoEm: string;
}

export interface ClientRecord {
  id: string;
  nb: string;
  descricao: string;
  criadoEm: string;
}

export interface AppState {
  t: DashboardTexts;
  cs: Collaborator[];
  ds: Demand[];
  logs?: CompletedActivityLog[];
  comodatos?: ComodatoRecord[];
  clients?: ClientRecord[];
}

export const STATUS_META: Record<StatusKey, { label: string; color: string; bg: string; plural: string; icon: string }> = {
  conc: { label: 'Concluída', color: '#2e9e5b', bg: '#d3efdc', plural: 'Concluídas', icon: '✔' },
  and: { label: 'Em andamento', color: '#f0a020', bg: '#fdeec8', plural: 'Em andamento', icon: '◔' },
  nao: { label: 'Não iniciada', color: '#2f7fd0', bg: '#d8e8f9', plural: 'Não iniciadas', icon: '❚❚' },
  atr: { label: 'Atrasada', color: '#e0393e', bg: '#fbd9da', plural: 'Atrasadas', icon: '!' },
};

export const PRIORITY_META: Record<PriorityKey, { label: string; color: string; bg: string }> = {
  urg: { label: 'Urgente', color: '#e0393e', bg: '#fbe1e1' },
  alta: { label: 'Alta', color: '#f0a020', bg: '#fdf1d3' },
  med: { label: 'Média', color: '#2f7fd0', bg: '#dde9f8' },
  bai: { label: 'Baixa', color: '#2e9e5b', bg: '#dcf1e4' },
};

export const FREQUENCIES: Frequency[] = ['Diária', 'Semanal', 'Quinzenal', 'Mensal', 'Pontual'];
