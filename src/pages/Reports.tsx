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
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { Download, BarChart3, TrendingUp, Award } from 'lucide-react';
import Header from '../components/layout/Header';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { buildTeamStats, buildServiceStats, getMonthlyEvolution } from '../lib/analytics';
import type { Team, Service, TeamVisit } from '../types';

interface ReportsProps {
  teams: Team[];
  services: Service[];
  visits: TeamVisit[];
  loading: boolean;
  onRefresh: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1729] border border-[#1e2d4d] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? '#94a3b8' }} className="font-medium">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Reports({ teams, services, visits, loading, onRefresh }: ReportsProps) {
  const stats = useMemo(() => buildTeamStats(teams, services, visits), [teams, services, visits]);
  const monthly = useMemo(() => getMonthlyEvolution(services, visits), [services, visits]);

  const servicesWithStats = useMemo(
    () => services.filter((s) => s.status === 'finalizado').map((s) => buildServiceStats(s, visits, teams)),
    [services, visits, teams]
  );

  const teamsWithData = stats.filter((s) => s.completed_services > 0);

  const comparativeData = teamsWithData.map((s) => ({
    name: s.team.name.length > 12 ? s.team.name.slice(0, 12) + '…' : s.team.name,
    'Dias Médios': parseFloat(s.avg_days_per_service.toFixed(1)),
    Serviços: s.completed_services,
    Score: s.performance_score,
    color: s.team.color,
  }));

  const statusData = [
    { name: 'Em Andamento', value: services.filter((s) => s.status === 'em_andamento').length, color: '#3b82f6' },
    { name: 'Finalizados', value: services.filter((s) => s.status === 'finalizado').length, color: '#10b981' },
  ].filter((d) => d.value > 0);

  const radarData = teamsWithData.slice(0, 6).map((s) => ({
    team: s.team.name.length > 8 ? s.team.name.slice(0, 8) + '…' : s.team.name,
    Score: s.performance_score,
    Serviços: Math.min(s.completed_services * 10, 100),
  }));

  const topServices = servicesWithStats
    .sort((a, b) => b.technical_days - a.technical_days)
    .slice(0, 8)
    .map((s) => ({
      name: s.client_name.length > 14 ? s.client_name.slice(0, 14) + '…' : s.client_name,
      'Dias Técnicos': s.technical_days,
    }));

  const handleExport = () => {
    const rows = [
      ['Equipe', 'Serviços Concluídos', 'Total Dias Técnicos', 'Média Dias/Serviço', 'Score', 'Categoria'],
      ...stats.map((s) => [
        s.team.name,
        s.completed_services,
        s.total_technical_days,
        s.avg_days_per_service.toFixed(2),
        s.performance_score,
        s.category === 'fast' ? 'Rápida' : s.category === 'average' ? 'Na Média' : 'Lenta',
      ]),
    ];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_equipes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Relatórios & Análises"
        subtitle="Visão analítica completa do desempenho"
        onRefresh={onRefresh}
        loading={loading}
        actions={
          <button onClick={handleExport} className="btn-secondary">
            <Download size={14} />
            Exportar CSV
          </button>
        }
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="flex-1 p-6 space-y-5 overflow-auto">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Total de Serviços', value: services.length, icon: BarChart3, color: 'blue' },
              { label: 'Finalizados', value: services.filter((s) => s.status === 'finalizado').length, icon: Award, color: 'green' },
              { label: 'Equipes Ativas', value: teams.length, icon: TrendingUp, color: 'orange' },
              {
                label: 'Média Geral (dias)',
                value: teamsWithData.length > 0
                  ? (teamsWithData.reduce((a, s) => a + s.avg_days_per_service, 0) / teamsWithData.length).toFixed(1)
                  : '—',
                icon: BarChart3,
                color: 'slate',
              },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              const colors: Record<string, string> = {
                blue: 'text-blue-400 bg-blue-500/10',
                green: 'text-emerald-400 bg-emerald-500/10',
                orange: 'text-orange-400 bg-orange-500/10',
                slate: 'text-slate-400 bg-slate-500/10',
              };
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass-card p-4 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[kpi.color]}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{kpi.label}</p>
                    <p className="text-xl font-bold text-white">{kpi.value}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Comparative Bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Comparativo de Equipes</h3>
              <p className="text-xs text-slate-500 mb-4">Dias médios e serviços concluídos</p>
              {comparativeData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-slate-600 text-sm">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={comparativeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Dias Médios" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Serviços" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Status Pie */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Status dos Serviços</h3>
              <p className="text-xs text-slate-500 mb-4">Distribuição por status atual</p>
              {statusData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-slate-600 text-sm">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Services by technical days */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Serviços por Dias Técnicos</h3>
              <p className="text-xs text-slate-500 mb-4">Top 8 serviços finalizados</p>
              {topServices.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-slate-600 text-sm">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topServices} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Dias Técnicos" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Radar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Radar de Desempenho</h3>
              <p className="text-xs text-slate-500 mb-4">Score e volume por equipe</p>
              {radarData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-slate-600 text-sm">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1e2d4d" />
                    <PolarAngleAxis dataKey="team" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                    <Radar name="Score" dataKey="Score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Radar name="Volume" dataKey="Serviços" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>

          {/* Detailed table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card overflow-hidden">
            <div className="p-5 border-b border-[#1e2d4d]">
              <h3 className="text-sm font-semibold text-white">Tabela Detalhada de Equipes</h3>
              <p className="text-xs text-slate-500 mt-0.5">Todos os dados de desempenho por equipe</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1e2d4d]">
                    {['#', 'Equipe', 'Serviços', 'Dias Total', 'Média/Serviço', 'Score', 'Categoria'].map((h) => (
                      <th key={h} className="text-left text-slate-500 font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, i) => {
                    const catColors = {
                      fast: 'badge-green',
                      average: 'badge-orange',
                      slow: 'badge-red',
                    };
                    return (
                      <tr key={s.team.id} className={`border-b border-[#1a2744]/40 hover:bg-[#0f1729]/50 transition-colors ${i % 2 === 0 ? '' : 'bg-[#080d1a]/30'}`}>
                        <td className="px-4 py-3 text-slate-500">{s.rank}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.team.color }} />
                            <span className="text-slate-200 font-medium">{s.team.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{s.completed_services}</td>
                        <td className="px-4 py-3 text-slate-300">{s.total_technical_days}</td>
                        <td className="px-4 py-3 text-slate-300">{s.avg_days_per_service.toFixed(1)}</td>
                        <td className="px-4 py-3 text-slate-300">{s.performance_score}</td>
                        <td className="px-4 py-3">
                          {s.completed_services > 0 ? (
                            <span className={catColors[s.category]}>
                              {s.category === 'fast' ? 'Rápida' : s.category === 'average' ? 'Na Média' : 'Lenta'}
                            </span>
                          ) : (
                            <span className="badge-blue">Sem dados</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
