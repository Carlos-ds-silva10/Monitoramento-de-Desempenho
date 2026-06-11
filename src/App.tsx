import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services.tsx';
import Visits from './pages/Visitis.tsx';
import Teams from './pages/Teams';
import Reports from './pages/Reports';
import { useTeams } from './hooks/useTeams';
import { useServices } from './hooks/useServices';
import { useVisits } from './hooks/useVisits';
import MonthlyProduction from './pages/MonthlyProduction';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';

type Page = 'dashboard' | 'services' | 'visits' | 'teams' | 'reports' | 'monthly-production';

const pageTransition = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
};

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [session, setSession] = useState<any>(null);
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
                services={services}
                visits={visits}
                loading={globalLoading}
                onRefresh={refreshAll}
              />
            )}
            {page === 'services' && (
              <Services
                services={services}
                teams={teams}
                visits={visits}
                loading={servicesLoading}
                onCreate={createService}
                onUpdate={updateService}
                onDelete={deleteService}
                onRefresh={fetchServices}
              />
            )}
            {page === 'visits' && (
              <Visits
                visits={visits}
                teams={teams}
                services={services}
                loading={visitsLoading}
                onCreate={createVisit}
                onUpdate={updateVisit}
                onDelete={deleteVisit}
                onRefresh={fetchVisits}
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
                services={services}
                visits={visits}
                loading={globalLoading}
                onRefresh={refreshAll}
              />
            )}
            {page === 'monthly-production' && (
              <MonthlyProduction
              teams={teams}
              services={services}
              visits={visits}
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
