import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, X } from 'lucide-react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { KpiCards } from './components/KpiCards';
import { CollaboratorPerformance } from './components/CollaboratorPerformance';
import { DemandsTable } from './components/DemandsTable';
import { ChartsPanel } from './components/ChartsPanel';
import { FooterCards } from './components/FooterCards';
import { DataEntryTab } from './components/DataEntryTab';
import { DemandModal } from './components/DemandModal';
import { LoginScreen } from './components/LoginScreen';
import { CollaboratorsTab } from './components/CollaboratorsTab';
import { CollaboratorModal, ModalFunctionItem } from './components/CollaboratorModal';
import { CollaboratorProfileTab } from './components/CollaboratorProfileTab';
import { CompletedActivitiesTab } from './components/CompletedActivitiesTab';
import { ComodatoTab } from './components/ComodatoTab';
import { ClientsTab } from './components/ClientsTab';
import { NavTab } from './components/Navigation';
import { AppState, ClientRecord, Collaborator, ComodatoRecord, CompletedActivityLog, Demand, DashboardTexts, PriorityKey, StatusKey, UserSession } from './types';
import { loadState, saveState, getSeedData } from './data';
import { exportToCSV, isHiddenUntilNextReset, getTodayYYYYMMDD, calculateDuration, calculateDurationMinutes, formatDate } from './utils';

function syncDemandToLogs(
  prevLogs: CompletedActivityLog[] | undefined,
  demand: Demand,
  collaborators: Collaborator[]
): CompletedActivityLog[] {
  const logs = [...(prevLogs || [])];
  const today = getTodayYYYYMMDD();
  const dateStr =
    demand.dataConclusao ||
    (demand.concluidoEm ? demand.concluidoEm.slice(0, 10) : today);

  const matchIdx = logs.findIndex(
    (l) =>
      l.demandId === demand.id &&
      (isHiddenUntilNextReset(l.concluidoEm) || (!l.concluidoEm && l.dataConclusao === dateStr))
  );

  if (demand.s === 'conc') {
    const colab = collaborators[demand.c];
    const hInicio = demand.horaInicio || '08:00';
    const hFim = demand.horaFim || '12:00';
    const existing = matchIdx >= 0 ? logs[matchIdx] : undefined;

    const entry: CompletedActivityLog = {
      id: existing?.id || `log-${demand.id}-${Date.now()}`,
      demandId: demand.id,
      colabIndex: demand.c,
      colabName: colab?.n || existing?.colabName || 'Colaborador',
      colabColor: colab?.c || existing?.colabColor || '#1e7fd8',
      atividade: demand.a,
      frequencia: demand.f || 'Diária',
      prioridade: (demand.pr || 'med') as PriorityKey,
      horaInicio: hInicio,
      horaFim: hFim,
      duracao: calculateDuration(hInicio, hFim),
      duracaoMinutos: calculateDurationMinutes(hInicio, hFim),
      dataConclusao: dateStr,
      concluidoEm: demand.concluidoEm || existing?.concluidoEm || new Date().toISOString(),
      obs: demand.obs || '',
    };

    if (matchIdx >= 0) {
      logs[matchIdx] = entry;
    } else {
      logs.unshift(entry);
    }
    return logs;
  } else {
    // Status changed away from 'conc' in the current cycle: remove current-cycle log if present
    if (matchIdx >= 0) {
      logs.splice(matchIdx, 1);
    }
    return logs;
  }
}

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const raw =
        localStorage.getItem('painel_fin_session') ||
        sessionStorage.getItem('painel_fin_session');
      if (raw) return JSON.parse(raw);
      if (
        localStorage.getItem('painel_fin_logged_in') === 'true' ||
        sessionStorage.getItem('painel_fin_logged_in') === 'true'
      ) {
        const name = localStorage.getItem('painel_fin_user') || 'Alisson';
        return { name, role: name === 'Alisson' ? 'manager' : 'colab' };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [state, setState] = useState<AppState>(() => loadState());
  const [activeTab, setActiveTab] = useState<NavTab>('dash');
  const [activeColabProfileIndex, setActiveColabProfileIndex] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<StatusKey | 'all'>('all');
  const [selectedColabIndex, setSelectedColabIndex] = useState<number | null>(null);
  const [selectedDashDate, setSelectedDashDate] = useState<string | null>(null);

  // Demand Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [demandToEdit, setDemandToEdit] = useState<Demand | null>(null);
  const [initialDemandColabIndex, setInitialDemandColabIndex] = useState<number | undefined>(undefined);

  // Collaborator Modal state
  const [isColabModalOpen, setIsColabModalOpen] = useState(false);
  const [colabToEdit, setColabToEdit] = useState<{ index: number; data: Collaborator } | null>(null);

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('theme-mode');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('theme-mode', darkMode ? 'dark' : 'light');
    } catch {}
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);

  // Automatic daily reset at 07:00 AM so completed/hidden demands reappear
  useEffect(() => {
    const checkDailyReset = () => {
      const now = new Date();
      setState((prev) => {
        const needsReset = prev.ds.some(
          (d) => Boolean(d.concluidoEm) && !isHiddenUntilNextReset(d.concluidoEm, now)
        );
        if (!needsReset) return prev;

        let nextLogs = prev.logs || [];
        const nextDs = prev.ds.map((d) => {
          if (d.concluidoEm && !isHiddenUntilNextReset(d.concluidoEm, now)) {
            nextLogs = syncDemandToLogs(nextLogs, d, prev.cs);
            return {
              ...d,
              s: 'nao' as StatusKey,
              obs: '',
              concluidoEm: '',
              dataConclusao: '',
            };
          }
          return d;
        });
        const nextState = { ...prev, ds: nextDs, logs: nextLogs };
        saveState(nextState);
        return nextState;
      });
    };

    const timer = setInterval(checkDailyReset, 30000);
    return () => clearInterval(timer);
  }, []);

  // Save changes to localStorage
  const updateState = (updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  };

  // Status toggle from table
  const handleUpdateDemandStatus = (demandId: string, status: StatusKey) => {
    updateState((prev) => {
      let nextLogs = prev.logs || [];
      const nextDs = prev.ds.map((d) => {
        if (d.id !== demandId) return d;
        const updated: Demand = {
          ...d,
          s: status,
          dataConclusao: status === 'conc' ? d.dataConclusao || getTodayYYYYMMDD() : '',
          ...(status !== 'conc' ? { concluidoEm: '' } : {}),
        };
        nextLogs = syncDemandToLogs(nextLogs, updated, prev.cs);
        return updated;
      });
      return {
        ...prev,
        ds: nextDs,
        logs: nextLogs,
      };
    });
  };

  // Update demand fields (e.g. horaInicio, horaFim, obs, concluidoEm, etc.)
  const handleUpdateDemandFields = (demandId: string, updates: Partial<Demand>) => {
    updateState((prev) => {
      let nextLogs = prev.logs || [];
      const nextDs = prev.ds.map((d) => {
        if (d.id !== demandId) return d;
        const updated: Demand = { ...d, ...updates };
        if (
          updated.s === 'conc' ||
          updates.s !== undefined ||
          updates.concluidoEm !== undefined
        ) {
          nextLogs = syncDemandToLogs(nextLogs, updated, prev.cs);
        }
        return updated;
      });
      return {
        ...prev,
        ds: nextDs,
        logs: nextLogs,
      };
    });
  };

  // Text updates
  const handleUpdateText = (key: keyof DashboardTexts, value: string) => {
    updateState((prev) => ({
      ...prev,
      t: { ...prev.t, [key]: value },
    }));
  };

  // Collaborator management
  const handleAddCollaborator = () => {
    updateState((prev) => {
      const newColab: Collaborator = {
        id: `colab-${Date.now()}`,
        n: 'Novo colaborador',
        d: 'Atividades e responsabilidades',
        c: '#1e7fd8',
      };
      return {
        ...prev,
        cs: [...prev.cs, newColab],
      };
    });
  };

  const handleUpdateCollaborator = (index: number, field: keyof Collaborator, value: string) => {
    updateState((prev) => {
      const newCs = [...prev.cs];
      newCs[index] = { ...newCs[index], [field]: value };
      return { ...prev, cs: newCs };
    });
  };

  const handleUpdateCollaboratorJornada = (index: number, updates: Partial<Collaborator>) => {
    updateState((prev) => {
      const newCs = [...prev.cs];
      if (newCs[index]) {
        newCs[index] = { ...newCs[index], ...updates };
      }
      return { ...prev, cs: newCs };
    });
  };

  const handleDeleteCollaborator = (index: number) => {
    if (!window.confirm('Tem certeza que deseja remover este colaborador e suas demandas associadas?')) {
      return;
    }
    updateState((prev) => {
      // Remove demands belonging to this collaborator and shift other indices
      const filteredDs = prev.ds
        .filter((d) => d.c !== index)
        .map((d) => (d.c > index ? { ...d, c: d.c - 1 } : d));
      const newCs = prev.cs.filter((_, idx) => idx !== index);
      return {
        ...prev,
        cs: newCs,
        ds: filteredDs,
      };
    });
    if (selectedColabIndex === index) {
      setSelectedColabIndex(null);
    }
  };

  // Demand management
  const handleAddDemand = () => {
    if (state.cs.length === 0) {
      alert('Cadastre um colaborador primeiro.');
      return;
    }
    updateState((prev) => {
      const newDemand: Demand = {
        id: `dem-${Date.now()}`,
        c: 0,
        a: 'Nova demanda',
        f: 'Diária',
        p: '',
        s: 'nao',
        pr: 'med',
        horaInicio: '08:00',
        horaFim: '12:00',
      };
      return {
        ...prev,
        ds: [...prev.ds, newDemand],
      };
    });
  };

  const handleUpdateDemand = (index: number, field: keyof Demand, value: any) => {
    updateState((prev) => {
      const newDs = [...prev.ds];
      const updated = { ...newDs[index], [field]: value };
      if (field === 's' && value === 'conc' && !updated.dataConclusao) {
        updated.dataConclusao = getTodayYYYYMMDD();
      }
      newDs[index] = updated;
      const nextLogs =
        updated.s === 'conc' || field === 's'
          ? syncDemandToLogs(prev.logs, updated, prev.cs)
          : prev.logs;
      return { ...prev, ds: newDs, logs: nextLogs };
    });
  };

  const handleDeleteDemand = (indexOrId: number | string) => {
    updateState((prev) => ({
      ...prev,
      ds: typeof indexOrId === 'number'
        ? prev.ds.filter((_, idx) => idx !== indexOrId)
        : prev.ds.filter((d) => d.id !== indexOrId),
    }));
  };

  const handleDeleteLog = (logId: string) => {
    updateState((prev) => ({
      ...prev,
      logs: (prev.logs || []).filter((l) => l.id !== logId),
    }));
  };

  const handleClearLogs = () => {
    if (window.confirm('Tem certeza de que deseja apagar todo o histórico de atividades realizadas?')) {
      updateState((prev) => ({
        ...prev,
        logs: [],
      }));
    }
  };

  // Comodato / Venda management
  const handleSaveComodato = (
    data: Omit<ComodatoRecord, 'id' | 'criadoEm'>,
    editId?: string
  ) => {
    updateState((prev) => {
      const current = prev.comodatos || [];
      if (editId) {
        return {
          ...prev,
          comodatos: current.map((r) =>
            r.id === editId ? { ...r, ...data, id: editId } : r
          ),
        };
      }
      const newRecord: ComodatoRecord = {
        ...data,
        id: `com-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        criadoEm: new Date().toISOString(),
      };
      return {
        ...prev,
        comodatos: [newRecord, ...current],
      };
    });
  };

  const handleDeleteComodato = (id: string) => {
    if (!session || session.role !== 'manager') return;
    updateState((prev) => ({
      ...prev,
      comodatos: (prev.comodatos || []).filter((r) => r.id !== id),
    }));
  };

  const handleClearComodatos = () => {
    if (!session || session.role !== 'manager') return;
    if (window.confirm('Tem certeza de que deseja apagar todos os registros de comodato/venda?')) {
      updateState((prev) => ({
        ...prev,
        comodatos: [],
      }));
    }
  };

  // Clients (NB / Descrição) management
  const handleSaveClient = (data: { nb: string; descricao: string }, editId?: string) => {
    updateState((prev) => {
      const current = prev.clients || [];
      const cleanNb = data.nb.trim();
      const cleanDesc = data.descricao.trim();

      if (editId) {
        return {
          ...prev,
          clients: current.map((c) =>
            c.id === editId ? { ...c, nb: cleanNb, descricao: cleanDesc } : c
          ),
        };
      }

      const existingIdx = current.findIndex(
        (c) => c.nb.trim().toLowerCase() === cleanNb.toLowerCase()
      );
      if (existingIdx >= 0) {
        const next = [...current];
        next[existingIdx] = {
          ...next[existingIdx],
          nb: cleanNb,
          descricao: cleanDesc,
        };
        return { ...prev, clients: next };
      }

      const newClient: ClientRecord = {
        id: `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        nb: cleanNb,
        descricao: cleanDesc,
        criadoEm: new Date().toISOString(),
      };
      return {
        ...prev,
        clients: [newClient, ...current],
      };
    });
  };

  const handleImportClients = (items: Array<{ nb: string; descricao: string }>): number => {
    let importedCount = 0;
    updateState((prev) => {
      const next = [...(prev.clients || [])];
      const indexByNb = new Map<string, number>();
      next.forEach((c, idx) => {
        const key = c.nb.trim().toLowerCase();
        if (key) indexByNb.set(key, idx);
      });

      items.forEach((item, i) => {
        const cleanNb = item.nb.trim();
        const cleanDesc = item.descricao.trim();
        if (!cleanNb || !cleanDesc) return;
        const key = cleanNb.toLowerCase();
        const existingIdx = indexByNb.get(key);
        if (typeof existingIdx === 'number') {
          next[existingIdx] = {
            ...next[existingIdx],
            nb: cleanNb,
            descricao: cleanDesc,
          };
        } else {
          indexByNb.set(key, next.length);
          next.push({
            id: `cli-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            nb: cleanNb,
            descricao: cleanDesc,
            criadoEm: new Date().toISOString(),
          });
        }
        importedCount += 1;
      });

      return { ...prev, clients: next };
    });
    return importedCount;
  };

  const handleDeleteClient = (id: string) => {
    if (!session || session.role !== 'manager') return;
    updateState((prev) => ({
      ...prev,
      clients: (prev.clients || []).filter((c) => c.id !== id),
    }));
  };

  const handleClearClients = () => {
    if (!session || session.role !== 'manager') return;
    if (window.confirm('Tem certeza de que deseja apagar todos os clientes cadastrados?')) {
      updateState((prev) => ({
        ...prev,
        clients: [],
      }));
    }
  };

  // Save from Modal
  const handleSaveModalDemand = (demandData: Omit<Demand, 'id'>, editId?: string) => {
    updateState((prev) => {
      if (editId) {
        let nextLogs = prev.logs || [];
        const nextDs = prev.ds.map((d) => {
          if (d.id !== editId) return d;
          const updated: Demand = {
            ...d,
            ...demandData,
            id: editId,
            dataConclusao:
              demandData.s === 'conc'
                ? d.dataConclusao || getTodayYYYYMMDD()
                : '',
          };
          if (updated.s === 'conc' || d.s === 'conc') {
            nextLogs = syncDemandToLogs(nextLogs, updated, prev.cs);
          }
          return updated;
        });
        return {
          ...prev,
          ds: nextDs,
          logs: nextLogs,
        };
      } else {
        const newD: Demand = {
          ...demandData,
          id: `dem-${Date.now()}`,
          dataConclusao: demandData.s === 'conc' ? getTodayYYYYMMDD() : '',
        };
        const nextLogs =
          newD.s === 'conc'
            ? syncDemandToLogs(prev.logs, newD, prev.cs)
            : prev.logs;
        return {
          ...prev,
          ds: [...prev.ds, newD],
          logs: nextLogs,
        };
      }
    });
  };

  const handleResetToSeed = () => {
    if (window.confirm('Deseja restaurar os dados de exemplo padrão? As alterações não salvas serão substituídas.')) {
      const seed = getSeedData();
      setState(seed);
      saveState(seed);
      setSelectedColabIndex(null);
      setStatusFilter('all');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Tem certeza de que deseja apagar todos os colaboradores e demandas?')) {
      const empty: AppState = {
        t: state.t,
        cs: [],
        ds: [],
        logs: [],
        comodatos: [],
        clients: [],
      };
      setState(empty);
      saveState(empty);
      setSelectedColabIndex(null);
      setStatusFilter('all');
    }
  };

  const handleImportJSON = (imported: AppState) => {
    setState(imported);
    saveState(imported);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('painel_fin_logged_in');
      localStorage.removeItem('painel_fin_user');
      localStorage.removeItem('painel_fin_session');
      sessionStorage.removeItem('painel_fin_logged_in');
      sessionStorage.removeItem('painel_fin_user');
      sessionStorage.removeItem('painel_fin_session');
    } catch {}
    setSession(null);
  };

  const handleSaveCollaboratorModal = (
    data: Omit<Collaborator, 'id'>,
    editIndex?: number,
    functionsList?: ModalFunctionItem[]
  ) => {
    updateState((prev) => {
      let nextCs: Collaborator[];
      let targetColabIndex: number;

      if (typeof editIndex === 'number' && editIndex >= 0) {
        nextCs = [...prev.cs];
        nextCs[editIndex] = { ...nextCs[editIndex], ...data };
        targetColabIndex = editIndex;
      } else {
        const newColab: Collaborator = {
          ...data,
          id: `colab-${Date.now()}`,
        };
        targetColabIndex = prev.cs.length;
        nextCs = [...prev.cs, newColab];
      }

      let nextDs = prev.ds;
      if (Array.isArray(functionsList)) {
        const otherDemands = prev.ds.filter((d) => d.c !== targetColabIndex);
        const existingColabDemands = prev.ds.filter((d) => d.c === targetColabIndex);

        const updatedColabDemands: Demand[] = functionsList.map((fn, idx) => {
          const existing = fn.id
            ? existingColabDemands.find((d) => d.id === fn.id)
            : undefined;
          const freq = fn.f || 'Diária';

          if (existing) {
            return {
              ...existing,
              a: fn.a,
              horaInicio: fn.horaInicio,
              horaFim: fn.horaFim,
              f: freq,
              p: freq === 'Diária' ? '' : (existing.p || prev.t.data || new Date().toISOString().split('T')[0]),
            };
          }

          return {
            id: `dem-${Date.now()}-${idx}`,
            c: targetColabIndex,
            a: fn.a,
            f: freq,
            p: freq === 'Diária' ? '' : (prev.t.data || new Date().toISOString().split('T')[0]),
            s: 'nao',
            pr: 'med',
            horaInicio: fn.horaInicio,
            horaFim: fn.horaFim,
          };
        });

        nextDs = [...otherDemands, ...updatedColabDemands];
      }

      return { ...prev, cs: nextCs, ds: nextDs };
    });
  };

  const handlePrint = () => {
    setActiveTab('dash');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // If not authenticated, show Login Screen first
  if (!session) {
    return (
      <LoginScreen
        collaborators={state.cs}
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          if (newSession.role === 'colab' && typeof newSession.colabIndex === 'number') {
            setActiveColabProfileIndex(newSession.colabIndex);
            setActiveTab('colab');
          } else {
            setActiveTab('dash');
          }
        }}
      />
    );
  }

  const isManager = session.role === 'manager';
  const roleLabel = isManager ? 'Gestor' : 'Colaborador';

  // Strict role-based isolation: collaborators can ONLY see their own routine, Comodato, and Cadastro de Clientes
  const effectiveTab: NavTab = isManager
    ? activeTab
    : activeTab === 'comodato'
    ? 'comodato'
    : activeTab === 'clientes'
    ? 'clientes'
    : 'colab';
  const effectiveColabIndex: number = isManager
    ? activeColabProfileIndex
    : typeof session.colabIndex === 'number'
    ? session.colabIndex
    : 0;

  const dashDemands = useMemo<Demand[]>(() => {
    if (!selectedDashDate) return [];

    const logsForDate = (state.logs || []).filter(
      (l) => l.dataConclusao === selectedDashDate
    );
    const loggedDemandIds = new Set(logsForDate.map((l) => l.demandId));

    const mappedFromLogs: Demand[] = logsForDate.map((log) => {
      const resolvedColabIndex = state.cs.findIndex((c) => c.n === log.colabName);
      return {
        id: log.demandId || log.id,
        c: resolvedColabIndex >= 0 ? resolvedColabIndex : log.colabIndex,
        a: log.atividade,
        f: log.frequencia || 'Diária',
        p: log.frequencia === 'Diária' ? '' : selectedDashDate,
        s: 'conc' as StatusKey,
        pr: log.prioridade || 'med',
        horaInicio: log.horaInicio,
        horaFim: log.horaFim,
        obs: log.obs || '',
        dataConclusao: log.dataConclusao,
        concluidoEm: log.concluidoEm,
      };
    });

    if (selectedDashDate === getTodayYYYYMMDD()) {
      const remainingToday = state.ds.filter((d) => !loggedDemandIds.has(d.id));
      return [...mappedFromLogs, ...remainingToday];
    }

    return mappedFromLogs;
  }, [selectedDashDate, state.ds, state.logs, state.cs]);

  return (
    <div className="min-h-screen bg-[#eef3f9] dark:bg-[#0e1623] text-[#14263f] dark:text-[#e8eef7] font-sans antialiased flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <Header
        texts={state.t}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onExportCSV={() => exportToCSV(state)}
        currentUser={`${session.name} (${roleLabel})`}
        onLogout={handleLogout}
        selectedDashDate={isManager ? selectedDashDate : null}
        isManager={isManager}
      />

      {/* Main Navigation */}
      <Navigation
        activeTab={effectiveTab}
        activeColabIndex={effectiveTab === 'colab' ? effectiveColabIndex : null}
        collaborators={state.cs}
        onChangeTab={(tab) => {
          if (isManager || tab === 'colab' || tab === 'comodato' || tab === 'clientes') {
            setActiveTab(tab);
          }
        }}
        onSelectColabTab={(index) => {
          if (isManager) {
            setActiveColabProfileIndex(index);
            setActiveTab('colab');
          }
        }}
        onOpenNewDemand={() => {
          if (isManager) {
            setDemandToEdit(null);
            setInitialDemandColabIndex(effectiveTab === 'colab' ? effectiveColabIndex : undefined);
            setIsModalOpen(true);
          }
        }}
        onPrint={handlePrint}
        demandsCount={dashDemands.length}
        completedLogsCount={state.logs?.length || 0}
        comodatosCount={state.comodatos?.length || 0}
        clientsCount={state.clients?.length || 0}
        userRole={session.role}
        userColabIndex={session.colabIndex}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 pb-12">
        {/* Painel Geral (Only Manager Alisson has access) */}
        {isManager && effectiveTab === 'dash' && (
          <div className="space-y-4">
            {selectedDashDate ? (
              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#0d3b73] dark:text-blue-200">
                  <Calendar className="w-4 h-4 text-[#1e6fc4] dark:text-blue-400 shrink-0" />
                  <span>
                    Exibindo no Dash a data selecionada:{' '}
                    <strong className="font-mono">{formatDate(selectedDashDate)}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDashDate(null)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-[#0d3b73] dark:text-blue-200 font-bold hover:bg-blue-100/70 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpar data selecionada</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span>
                    Nenhuma data selecionada — o Dash permanece zerado até você escolher uma data.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('realizadas')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1e6fc4] hover:bg-[#165a9f] text-white font-bold transition-colors cursor-pointer"
                >
                  <span>Selecionar data em Atividades Realizadas</span>
                </button>
              </div>
            )}

            {/* 1. KPIs */}
            <KpiCards
              demands={dashDemands}
              statusFilter={statusFilter}
              onSelectStatusFilter={setStatusFilter}
            />

            {/* 2. Three-column Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)_285px] xl:grid-cols-[310px_minmax(0,1fr)_320px] gap-4 items-start">
              {/* Left Column: Desempenho por Colaborador */}
              <CollaboratorPerformance
                collaborators={state.cs}
                demands={dashDemands}
                selectedColabIndex={selectedColabIndex}
                onSelectColab={setSelectedColabIndex}
                onNavigateToProfile={(index) => {
                  setActiveColabProfileIndex(index);
                  setActiveTab('colab');
                }}
              />

              {/* Middle Column: Demandas em Andamento (Table) */}
              <div className="min-w-0">
                <DemandsTable
                  collaborators={state.cs}
                  demands={dashDemands}
                  statusFilter={statusFilter}
                  selectedColabIndex={selectedColabIndex}
                  onUpdateDemandStatus={handleUpdateDemandStatus}
                  onEditDemand={(demand) => {
                    setDemandToEdit(demand);
                    setInitialDemandColabIndex(demand.c);
                    setIsModalOpen(true);
                  }}
                  onDeleteDemand={handleDeleteDemand}
                />
              </div>

              {/* Right Column: Charts & Priority Breakdown */}
              <ChartsPanel
                collaborators={state.cs}
                demands={dashDemands}
              />
            </div>

            {/* 3. Footer Cards */}
            <FooterCards texts={state.t} />
          </div>
        )}

        {/* Tab: Atividades Realizadas (Only Manager Alisson has access) */}
        {isManager && effectiveTab === 'realizadas' && (
          <CompletedActivitiesTab
            logs={state.logs || []}
            collaborators={state.cs}
            onDeleteLog={handleDeleteLog}
            onClearLogs={handleClearLogs}
            selectedDashDate={selectedDashDate}
            onSelectDashDate={setSelectedDashDate}
            onNavigateToDash={() => setActiveTab('dash')}
          />
        )}

        {/* Tab: Comodato (Accessible to Manager & Collaborators; only Manager Alisson can delete) */}
        {effectiveTab === 'comodato' && (
          <ComodatoTab
            records={state.comodatos || []}
            clients={state.clients || []}
            onSaveRecord={handleSaveComodato}
            onDeleteRecord={handleDeleteComodato}
            onClearRecords={handleClearComodatos}
            canDelete={isManager}
          />
        )}

        {/* Tab: Cadastro de Clientes (NB / Descrição) */}
        {effectiveTab === 'clientes' && (
          <ClientsTab
            clients={state.clients || []}
            onSaveClient={handleSaveClient}
            onImportClients={handleImportClients}
            onDeleteClient={handleDeleteClient}
            onClearClients={handleClearClients}
            canDelete={isManager}
          />
        )}

        {/* Tab: Individual Collaborator Profile & Hours Schedule */}
        {effectiveTab === 'colab' && (
          <CollaboratorProfileTab
            collaborators={state.cs}
            demands={state.ds}
            activeColabIndex={effectiveColabIndex}
            onSelectColabIndex={(idx) => {
              if (isManager) setActiveColabProfileIndex(idx);
            }}
            onUpdateDemand={handleUpdateDemandFields}
            onOpenNewDemand={(colabIndex) => {
              if (isManager) {
                setDemandToEdit(null);
                setInitialDemandColabIndex(colabIndex);
                setIsModalOpen(true);
              }
            }}
            onEditDemand={(demand) => {
              if (isManager) {
                setDemandToEdit(demand);
                setInitialDemandColabIndex(demand.c);
                setIsModalOpen(true);
              }
            }}
            onDeleteDemand={(id) => {
              if (isManager) handleDeleteDemand(id);
            }}
            onEditCollaborator={(index, colab) => {
              if (isManager) {
                setColabToEdit({ index, data: colab });
                setIsColabModalOpen(true);
              }
            }}
            onUpdateCollaboratorJornada={handleUpdateCollaboratorJornada}
            isManager={isManager}
          />
        )}

        {/* Tab 2: Cadastro de Colaboradores e Funções Geral (Only Manager) */}
        {isManager && effectiveTab === 'colabs' && (
          <CollaboratorsTab
            collaborators={state.cs}
            demands={state.ds}
            onOpenNewCollaborator={() => {
              setColabToEdit(null);
              setIsColabModalOpen(true);
            }}
            onEditCollaborator={(index, colab) => {
              setColabToEdit({ index, data: colab });
              setIsColabModalOpen(true);
            }}
            onDeleteCollaborator={handleDeleteCollaborator}
            onSelectColabInDashboard={(index) => {
              setSelectedColabIndex(index);
              setActiveTab('dash');
            }}
            onSelectColabProfile={(index) => {
              setActiveColabProfileIndex(index);
              setActiveTab('colab');
            }}
            onAddDemandForColab={(index) => {
              setDemandToEdit(null);
              setInitialDemandColabIndex(index);
              setIsModalOpen(true);
            }}
          />
        )}

        {/* Tab 3: Configurações Gerais e Preenchimento (Only Manager) */}
        {isManager && effectiveTab === 'ed' && (
          <DataEntryTab
            state={state}
            onUpdateText={handleUpdateText}
            onAddCollaborator={() => {
              setColabToEdit(null);
              setIsColabModalOpen(true);
            }}
            onUpdateCollaborator={handleUpdateCollaborator}
            onDeleteCollaborator={handleDeleteCollaborator}
            onAddDemand={handleAddDemand}
            onUpdateDemand={handleUpdateDemand}
            onDeleteDemand={handleDeleteDemand}
            onResetToSeed={handleResetToSeed}
            onClearAll={handleClearAll}
            onImportJSON={handleImportJSON}
          />
        )}
      </main>

      {/* Modal for Creating or Editing Demand */}
      <DemandModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        collaborators={state.cs}
        demandToEdit={demandToEdit}
        defaultDate={state.t.data}
        initialColabIndex={initialDemandColabIndex}
        onSaveDemand={handleSaveModalDemand}
      />

      {/* Modal for Creating or Editing Collaborator & Functions */}
      <CollaboratorModal
        isOpen={isColabModalOpen}
        onClose={() => setIsColabModalOpen(false)}
        collaboratorToEdit={colabToEdit}
        collaboratorDemands={
          colabToEdit ? state.ds.filter((d) => d.c === colabToEdit.index) : []
        }
        onSave={handleSaveCollaboratorModal}
      />
    </div>
  );
}
