import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Trophy,
  Zap,
  TrendingDown,
  Target,
  CheckCircle2,
  Clock,
  Users,
  Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Header from '../components/layout/Header';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { buildTeamStats, getMonthlyEvolution, getTeamProductionStats, getWeeklyProductionStats, } from '../lib/analytics';
import type { Team, Service, TeamVisit } from '../types';

interface DashboardProps {
  teams: Team[];
  services: Service[];
  visits: TeamVisit[];
  loading: boolean;
  onRefresh: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

function categoryColor(cat: 'fast' | 'average' | 'slow') {
  if (cat === 'fast') return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', bar: '#10b981' };
  if (cat === 'average') return { text: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/20', bar: '#f97316' };
  return { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', bar: '#ef4444' };
}

function categoryLabel(cat: 'fast' | 'average' | 'slow') {
  if (cat === 'fast') return 'Rápida';
  if (cat === 'average') return 'Na Média';
  return 'Lenta';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1729] border border-[#1e2d4d] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard({ teams, services, visits, loading, onRefresh }: DashboardProps) {
  const stats = useMemo(() => buildTeamStats(teams, services, visits), [teams, services, visits]);
  const monthlyData = useMemo(() => getMonthlyEvolution(services, visits), [services, visits]);
const productionStats = useMemo(() => getTeamProductionStats(teams, services, visits), [teams, services, visits]);
const weeklyProduction = useMemo(() => getWeeklyProductionStats(teams, services, visits), [teams, services, visits]);
const topInstallationTeam = productionStats .slice() .sort((a, b) => b.installations - a.installations)[0];
const topMaintenanceTeam = productionStats .slice() .sort((a, b) => b.maintenances - a.maintenances)[0];

  const fastest = stats.find((s) => s.category === 'fast');
  const slowest = stats .filter((s) => s.completed_services > 0) .sort((a, b) => b.avg_days_per_service - a.avg_days_per_service)[0];
  const mostProductive = stats.slice().sort((a, b) => b.completed_services - a.completed_services)[0];
  const avgTeams = stats.filter((s) => s.category === 'average');

  const finishedCount = services.filter((s) => s.status === 'finalizado').length;
  const activeCount = services.filter((s) => s.status === 'em_andamento').length;
  const globalAvg =
    stats.filter((s) => s.completed_services > 0).length > 0
      ? stats.filter((s) => s.completed_services > 0).reduce((a, s) => a + s.avg_days_per_service, 0) /
        stats.filter((s) => s.completed_services > 0).length
      : 0;

  const rankingChartData = stats
    .filter((s) => s.completed_services > 0)
    .map((s) => ({
      name: s.team.name.length > 10 ? s.team.name.slice(0, 10) + '…' : s.team.name,
      'Dias Médios': parseFloat(s.avg_days_per_service.toFixed(1)),
      Serviços: s.completed_services,
      fill: categoryColor(s.category).bar,
    }));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Visão geral de desempenho das equipes técnicas"
        onRefresh={onRefresh}
        loading={loading}/>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          {/* KPI Row 1 */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            <KpiCard
              icon={Trophy}
              label="Mais Produtiva"
              value={mostProductive?.team.name ?? '—'}
              sub={mostProductive ? `${mostProductive.completed_services} serviços concluídos` : 'Sem dados'}
              accent="blue"
              delay={0}
            />
            <KpiCard
              icon={Zap}
              label="Mais Rápida"
              value={fastest?.team.name ?? '—'}
              sub={fastest ? `${fastest.avg_days_per_service.toFixed(1)} dias médios` : 'Sem dados'}
              accent="green"
              delay={1}
            />
            <KpiCard
              icon={TrendingDown}
              label="Mais Lenta"
              value={slowest?.team.name ?? '—'}
              sub={ slowest ? `${slowest.avg_days_per_service.toFixed(1)} dias médios` : 'Sem dados'} accent="red" delay={2}
              />
            <KpiCard
              icon={Target}
              label="Média Geral"
              value={`${globalAvg.toFixed(1)} dias`}
              sub={`${avgTeams.length} equipe(s) na média`}
              accent="orange"
              delay={3}
            />
          </motion.div>

          {/* KPI Row 2 */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <StatCard icon={CheckCircle2} label="Serviços Finalizados" value={finishedCount} color="emerald" />
            <StatCard icon={Clock} label="Em Andamento" value={activeCount} color="blue" />
            <StatCard icon={Users} label="Equipes Ativas" value={teams.length} color="slate" />
          </motion.div>

          {/* Charts */}
          <motion.div
          variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard icon={Trophy} label="Mais Instalações" value={topInstallationTeam?.team.name ?? '—'}
            sub={`${topInstallationTeam?.installations ?? 0} instalação(ões)`} accent="blue" delay={0} /> 
            <KpiCard icon={Target} label="Mais Manutenções" value={topMaintenanceTeam?.team.name ?? '—'} 
             sub={`${topMaintenanceTeam?.maintenances ?? 0} manutenção(ões)`} accent="orange" delay={1} />
             </motion.div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Ranking chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-5"
            >
              <h3 className="text-sm font-semibold text-white mb-1">Dias Médios por Equipe</h3>
              <p className="text-xs text-slate-500 mb-4">Média de dias técnicos para conclusão</p>
              {rankingChartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
                  Sem dados suficientes
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={rankingChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Dias Médios" radius={[6, 6, 0, 0]}>
                      {rankingChartData.map((entry, i) => (
                        <rect key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Monthly evolution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-5"
            >
              <h3 className="text-sm font-semibold text-white mb-1">Evolução Mensal</h3>
              <p className="text-xs text-slate-500 mb-4">Serviços concluídos e dias médios</p>
              {monthlyData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
                  Sem dados suficientes
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Concluídos"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg_days"
                      name="Dias Médios"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>

     {/* GRÁFICO SEMANAL */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-1"> Gráfico Semanal </h3>
               <p className="text-xs text-slate-500 mb-4"> Produção das equipes nesta semana </p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                   data={weeklyProduction .slice() .sort((a, b) => b.total - a.total)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                    <XAxis
                    dataKey="team.name"
                    tick={{ fill: "#64748b" }}/>
                    <YAxis tick={{ fill: "#64748b" }} />
                    <Tooltip />
                    <Bar
                     dataKey="installations"
                     name="Instalações" fill="#3b82f6"/>
                     <Bar
                     dataKey="maintenances"
                     name="Manutenções"
                     fill="#f97316"/>
                     </BarChart>
                     </ResponsiveContainer>
                     </motion.div>
          {/* Team Ranking Table */}
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Produção da Semana</h3>
            <p className="text-xs text-slate-500 mb-4">Instalações e manutenções realizadas nesta semana</p>
            <div className="space-y-2">{weeklyProduction.slice() .sort((a, b) => b.total - a.total) .map((team, index) => (<div
            key={team.team.id}
            className="flex items-center justify-between p-3 rounded-xl bg-[#080d1a]/60 border border-[#1a2744]/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1a2744] flex items-center justify-center text-sm font-bold text-white">
                  {index + 1}
                  </div>
                  <span className="font-medium text-white"> 
                     {team.team.name}
                     </span>
                     </div>
                     <div className="flex gap-6 text-sm">
                      <span className="text-blue-400">Instalações: {team.installations}</span>
                      <span className="text-orange-400">Manutenções: {team.maintenances}</span>
                      <span className="text-emerald-400 font-semibold">Total: {team.total} 
                      </span>
                      </div>
                      </div>
                     ))}
                     </div>
            </motion.div>

            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Ranking de Equipes</h3>
                <p className="text-xs text-slate-500">Classificação por velocidade de conclusão</p>
              </div>
              <Activity size={16} className="text-slate-500" />
            </div>

            {stats.filter((s) => s.completed_services > 0).length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-8">Sem dados suficientes para o ranking</p>
            ) : (
              <div className="space-y-2">
                {stats
                  .filter((s) => s.completed_services > 0)
                  .map((stat, idx) => {
                    const colors = categoryColor(stat.category);
                    return (
                      <motion.div
                        key={stat.team.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-[#080d1a]/60 border border-[#1a2744]/40 hover:border-[#2d3f6e]/60 transition-colors"
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            idx === 0
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : idx === 1
                              ? 'bg-slate-500/20 text-slate-400'
                              : idx === 2
                              ? 'bg-orange-600/20 text-orange-500'
                              : 'bg-[#1a2744] text-slate-500'
                          }`}
                        >
                          {stat.rank}
                        </div>

                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: stat.team.color }}
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{stat.team.name}</p>
                          <p className="text-xs text-slate-500">{stat.completed_services} serviços concluídos</p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">
                            {stat.avg_days_per_service.toFixed(1)}
                            <span className="text-xs text-slate-500 font-normal ml-1">dias</span>
                          </p>
                        </div>

                        <div className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {categoryLabel(stat.category)}
                        </div>

                        {/* Progress bar */}
                        <div className="w-24 hidden lg:block">
                          <div className="h-1.5 bg-[#1a2744] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${stat.performance_score}%` }}
                              transition={{ delay: 0.3 + idx * 0.05, duration: 0.8, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: colors.bar }}
                            />
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 text-right">{stat.performance_score}pts</p>
                        </div>
                      </motion.div>
                      
                    );
                  })}
              </div>
            )}
             </motion.div>

          {/* PRODUÇÃO POR EQUIPE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4">
              Produção por Equipe
            </h3>
            <div className="space-y-2">
             {productionStats .slice() .sort((a, b) => b.total - a.total) .map((team) => (
                <div
                  key={team.team.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#080d1a]/60 border border-[#1a2744]/40">
                  <span className="font-medium text-white">
                    {team.team.name}
                  </span>
                  <div className="flex gap-6 text-sm">
                    <span className="text-blue-400">
                      Instalações: {team.installations}
                    </span>
                    <span className="text-orange-400">
                      Manutenções: {team.maintenances}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      Total: {team.total}
                    </span>
                  </div>
                </div>
              ))}
              </div>
             </motion.div>
           </div>
        )}
      </div>
     )
     ;}       


function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  delay,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  accent: 'blue' | 'green' | 'red' | 'orange';
  delay: number;
}) {
  const accents = {
    blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'shadow-blue-900/10' },
    green: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-900/10' },
    red: { icon: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'shadow-red-900/10' },
    orange: { icon: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', glow: 'shadow-orange-900/10' },
  };
  const c = accents[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08 }}
      whileHover={{ y: -2 }}
      className={`glass-card p-5 border ${c.border} shadow-lg ${c.glow}`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={16} className={c.icon} />
        </div>
      </div>
      <p className="text-lg font-bold text-white truncate">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: 'emerald' | 'blue' | 'slate';
}) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    slate: 'text-slate-400 bg-slate-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -1 }}
      className="glass-card p-4 flex items-center gap-4"
    >
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center shrink-0`}>
        <Icon size={18} className={colors[color].split(' ')[0]} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <AnimatedNumber value={value} className="text-2xl font-bold text-white" />
      </div>
    </motion.div>
  );
}
