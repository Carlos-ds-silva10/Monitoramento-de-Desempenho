import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePeriod } from './context/PeriodContext';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services.tsx';
import Visits from './pages/Visitis.tsx';
import Teams from './pages/Teams';
import Reports from './pages/Reports';
import Reincidences from './pages/Reincidences';
import Quality from './pages/Quality';
import { useTeams } from './hooks/useTeams';
import { useServices } from './hooks/useServices';
import { useVisits } from './hooks/useVisits';
import MonthlyProduction from './pages/MonthlyProduction';
import { useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Login from './pages/Login';

type Page = 'dashboard' | 'services' | 'visits' | 'teams' | 'reports' | 'monthly-production' | 'reincidences' | 'quality';

const pageTransition = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
};

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
  async function getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);
    setAuthLoading(false);
  }

  getSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  return () => subscription.unsubscribe();
}, []);

  const {
    teams,
    loading: teamsLoading,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
  } = useTeams();

  const {
    services,
    loading: servicesLoading,
    fetchServices,
    createService,
    updateService,
    deleteService,
  } = useServices();

  const {
    visits,
    loading: visitsLoading,
    fetchVisits,
    createVisit,
    updateVisit,
    deleteVisit,
  } = useVisits();

  const refreshAll = useCallback(() => {
    fetchTeams();
    fetchServices();
    fetchVisits();
  }, [fetchTeams, fetchServices, fetchVisits]);

  const { selectedYear, selectedMonth } = usePeriod();

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const d = new Date(s.opened_at);
      const matchesYear = d.getFullYear().toString() === selectedYear;
      const matchesMonth = selectedMonth === 'Todos' || d.getMonth().toString() === selectedMonth;
      return matchesYear && matchesMonth;
    });
  }, [services, selectedYear, selectedMonth]);

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const d = new Date(v.visit_date);
      const matchesYear = d.getFullYear().toString() === selectedYear;
      const matchesMonth = selectedMonth === 'Todos' || d.getMonth().toString() === selectedMonth;
      return matchesYear && matchesMonth;
    });
  }, [visits, selectedYear, selectedMonth]);

  const globalLoading = teamsLoading || servicesLoading || visitsLoading;

  if (authLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] text-white">
      Carregando...
    </div>
  );
}

if (!session) {
  return <Login />;
}
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-800/5 rounded-full blur-3xl" />
      </div>

      <Sidebar
  currentPage={page}
  onNavigate={setPage}
  collapsed={collapsed}
  onToggle={() => setCollapsed(!collapsed)}
  />

   <main className={`flex-1 min-h-screen flex flex-col relative transition-all duration-300 ${
    collapsed ? 'ml-20' : 'ml-64' }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            {...pageTransition}
            transition={{ duration: 0.18 }}
            className="flex-1 flex flex-col"
          >
            {page === 'dashboard' && (
              <Dashboard
                teams={teams}
                services={filteredServices}
                visits={filteredVisits}
                loading={globalLoading}
                onRefresh={refreshAll}
              />
            )}
            {page === 'services' && (
              <Services
                services={filteredServices}
                teams={teams}
                visits={filteredVisits}
                loading={servicesLoading}
                onCreate={createService}
                onUpdate={updateService}
                onDelete={deleteService}
                onRefresh={fetchServices}
              />
            )}
            {page === 'visits' && (
              <Visits
                visits={filteredVisits}
                teams={teams}
                services={filteredServices}
                loading={visitsLoading}
                onCreate={createVisit}
                onUpdate={updateVisit}
                onDelete={deleteVisit}
                onRefresh={fetchVisits}
              />
            )}
            {page === 'reincidences' && (
              <Reincidences services={filteredServices} onRefresh={fetchServices} />
            )}
            {page === 'quality' && (
              <Quality
                teams={teams}
                services={filteredServices}
                visits={filteredVisits}
                loading={globalLoading}
                onRefresh={refreshAll}
              />
            )}
            {page === 'teams' && (
              <Teams
                teams={teams}
                services={services}
                visits={visits}
                loading={teamsLoading}
                onCreate={createTeam}
                onUpdate={updateTeam}
                onDelete={deleteTeam}
                onRefresh={fetchTeams}
              />
            )}
            {page === 'reports' && (
              <Reports
                teams={teams}
                services={filteredServices}
                visits={filteredVisits}
                loading={globalLoading}
                onRefresh={refreshAll}
              />
            )}
            {page === 'monthly-production' && (
              <MonthlyProduction
                teams={teams}
                services={filteredServices}
                visits={filteredVisits}
                loading={globalLoading}
                onRefresh={refreshAll}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
