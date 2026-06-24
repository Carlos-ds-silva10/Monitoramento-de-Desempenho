import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Legend,
} from 'recharts';
import {
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Award,
  Repeat2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Header from '../components/layout/Header';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { useReincidences } from '../hooks/useReincidences';
import type { Service, Team, TeamVisit, SegmentType } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QualityProps {
  teams?: Team[];
  services?: Service[];
  visits?: TeamVisit[];
  selectedYear?: number;
  selectedMonth?: number | null;
  loading?: boolean;
  onRefresh: () => void;
}

interface TeamQualityStat {
  team: Team;
  completedServices: number;
  reincidences: number;
  reincidencesOpen: number;
  reincidencesClosed: number;
  reincidenceRate: number;   // %
  qualityIndex: number;      // 100 − rate
  rank: number;
}

interface SegmentStat {
  seg: SegmentType;
  label: string;
  count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SEGMENT_LABELS: Record<SegmentType, string> = {
  cameras: 'Câmeras',
  portao: 'Portão',
  alarme: 'Alarme',
  cerca_eletrica: 'Cerca Elétrica',
  controle_acesso: 'Controle de Acesso',
  rede: 'Rede',
  interfone: 'Interfone',
  outro: 'Outro',
};

function segmentLabel(seg: SegmentType | string): string {
  return SEGMENT_LABELS[seg as SegmentType] ?? seg;
}

function formatDate(date: string): string {
  if (!date) return '-';
  const [year, month, day] = date.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

function qualityColor(qi: number): { text: string; bg: string; border: string; bar: string } {
  if (qi >= 90) return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', bar: '#10b981' };
  if (qi >= 75) return { text: 'text-blue-400',    bg: 'bg-blue-500/15',    border: 'border-blue-500/20',    bar: '#3b82f6' };
  if (qi >= 60) return { text: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/20',  bar: '#f97316' };
  return              { text: 'text-red-400',      bg: 'bg-red-500/15',     border: 'border-red-500/20',     bar: '#ef4444' };
}

function qualityLabel(qi: number): string {
  if (qi >= 90) return 'Excelente';
  if (qi >= 75) return 'Boa';
  if (qi >= 60) return 'Regular';
  return 'Crítica';
}

const MONTHS_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1729] border border-[#1e2d4d] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? '#94a3b8' }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ─── SummaryCard ──────────────────────────────────────────────────────────────
interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent: 'blue' | 'green' | 'red' | 'orange' | 'purple';
  delay?: number;
  isNumber?: boolean;
}

function SummaryCard({
  icon: Icon, label, value, sub, accent, delay = 0, isNumber = false,
}: SummaryCardProps) {
  const accents = {
    blue:   { icon: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   glow: 'shadow-blue-900/10'   },
    green:  { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-900/10' },
    red:    { icon: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     glow: 'shadow-red-900/10'    },
    orange: { icon: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  glow: 'shadow-orange-900/10' },
    purple: { icon: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  glow: 'shadow-purple-900/10' },
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
      {isNumber && typeof value === 'number' ? (
        <AnimatedNumber value={value} className="text-xl font-bold text-white" />
      ) : (
        <p className="text-xl font-bold text-white truncate">{value}</p>
      )}
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Quality({
  teams, services, visits, selectedYear, selectedMonth, loading: externalLoading, onRefresh,
}: QualityProps) {
  const { reincidences, loading: reincLoading, fetchReincidences } = useReincidences();
  const loading = externalLoading || reincLoading;

  const handleRefresh = useCallback(() => {
    fetchReincidences();
    onRefresh();
  }, [fetchReincidences, onRefresh]);

  // Fallbacks seguros com useMemo para não gerar novas referências
  const safeTeams = useMemo(() => teams ?? [], [teams]);
  const safeServices = useMemo(() => services ?? [], [services]);
  const safeVisits = useMemo(() => visits ?? [], [visits]);
  const safeReincidences = useMemo(() => reincidences ?? [], [reincidences]);

  // Período Global Fallback
  const year = selectedYear ?? new Date().getFullYear();
  const month = selectedMonth ?? null;

  // Filtros Locais da Tabela de Reincidências Recentes
  const [tableMonth, setTableMonth] = useState<number | null>(null);
  const [tableTeamId, setTableTeamId] = useState<string>('all');
  const [tableSegment, setTableSegment] = useState<string>('all');
  const [tableStatus, setTableStatus] = useState<string>('all');

  // ── 1. Filtered Data by Global Period ─────────────────────────────────────
  const filteredReincidences = useMemo(() => {
    return safeReincidences.filter((r) => {
      if (!r.opened_at) return false;
      const d = new Date(r.opened_at);
      if (d.getFullYear() !== year) return false;
      if (month !== null && d.getMonth() + 1 !== month) return false;
      return true;
    });
  }, [safeReincidences, year, month]);

  const filteredCompleted = useMemo(() => {
    return safeServices.filter((s) => {
      if (s.status !== 'finalizado' || !s.closed_at) return false;
      const d = new Date(s.closed_at);
      if (d.getFullYear() !== year) return false;
      if (month !== null && d.getMonth() + 1 !== month) return false;
      return true;
    });
  }, [safeServices, year, month]);

  // ── 2. Service → Teams Map ────────────────────────────────────────────────
  const serviceTeamMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    safeVisits.forEach((v) => {
      if (!map.has(v.service_id)) map.set(v.service_id, new Set<string>());
      map.get(v.service_id)!.add(v.team_id);
    });
    return map;
  }, [safeVisits]);

  // ── 3. Team Quality Stats ─────────────────────────────────────────────────
  const teamStats = useMemo((): TeamQualityStat[] => {
    const stats = safeTeams.map((team) => {
      // Serviços finalizados no período onde essa equipe participou
      const teamCompleted = filteredCompleted.filter((s) => {
        const teamIds = serviceTeamMap.get(s.id);
        return teamIds?.has(team.id) ?? false;
      }).length;

      // Reincidências da equipe no período
      const teamReinc = filteredReincidences.filter(r => r.assigned_team_id === team.id);
      
      
      const reincidencesCount = teamReinc.length;
      
      const reincidencesOpen = teamReinc.filter(r => r.status === 'em_andamento').length;
      const reincidencesClosed = teamReinc.filter(r => r.status === 'finalizado').length;

      const rate = teamCompleted > 0 ? (reincidencesCount / teamCompleted) * 100 : 0;
      const cappedRate = Math.min(rate, 100);

      return {
        team,
        completedServices: teamCompleted,
        reincidences: reincidencesCount,
        reincidencesOpen,
        reincidencesClosed,
        reincidenceRate: parseFloat(cappedRate.toFixed(1)),
        qualityIndex: parseFloat(Math.max(0, 100 - cappedRate).toFixed(1)),
        rank: 0,
      };
    });

    // Sort by lower incidence rate, placing active teams first
    stats.sort((a, b) => {
      const aActive = a.completedServices > 0 || a.reincidences > 0;
      const bActive = b.completedServices > 0 || b.reincidences > 0;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      if (a.reincidenceRate === b.reincidenceRate) return b.completedServices - a.completedServices;
      return a.reincidenceRate - b.reincidenceRate;
    });

    return stats.map((s, i) => ({ ...s, rank: i + 1 }));
  }, [safeTeams, filteredCompleted, filteredReincidences, serviceTeamMap]);

  // ── 4. Global KPIs ────────────────────────────────────────────────────────
  const totalReincPeriod = filteredReincidences.length;
  const totalReincOpenPeriod = filteredReincidences.filter(r => r.status === 'em_andamento').length;
  const totalFinishedPeriod = filteredCompleted.length;

  const globalRate = useMemo(() =>
    totalFinishedPeriod > 0
      ? parseFloat(((totalReincPeriod / totalFinishedPeriod) * 100).toFixed(1))
      : 0
  , [totalReincPeriod, totalFinishedPeriod]);

  const globalQualityIndex = Math.max(0, 100 - globalRate);

  const activeTeams = useMemo(
    () => teamStats.filter((s) => s.completedServices > 0 || s.reincidences > 0),
    [teamStats]
  );
  
  const bestTeam  = activeTeams[0];
  const worstTeam = activeTeams[activeTeams.length - 1];

  // ── 5. Critical Teams (taxa > 15%) ────────────────────────────────────────
  const criticalTeams = useMemo(
    () => teamStats.filter((s) => s.reincidenceRate > 15 && s.completedServices > 0),
    [teamStats]
  );

  // ── 6. Bar Chart Data ─────────────────────────────────────────────────────
  const barChartData = useMemo(() =>
    teamStats.filter(s => s.completedServices > 0 || s.reincidences > 0).map((s) => ({
      name: s.team.name.length > 10 ? s.team.name.slice(0, 10) + '…' : s.team.name,
      'Reincidências': s.reincidences,
      'Índice de Qualidade': s.qualityIndex,
      'Taxa': s.reincidenceRate,
      fill: qualityColor(s.qualityIndex).bar,
    }))
  , [teamStats]);

  // ── 7. Monthly Evolution (Year view) ──────────────────────────────────────
  const monthlyEvolution = useMemo(() => {
    return MONTHS_LABELS.map((m, i) => {
      const monthIndex = i + 1;
      
      const count = safeReincidences.filter(r => {
        if (!r.opened_at) return false;
        const d = new Date(r.opened_at);
        return d.getFullYear() === year && (d.getMonth() + 1) === monthIndex;
      }).length;
      
      const finishedCount = safeServices.filter(s => {
        if (s.status !== 'finalizado' || !s.closed_at) return false;
        const d = new Date(s.closed_at);
        return d.getFullYear() === year && (d.getMonth() + 1) === monthIndex;
      }).length;

      return { month: m, Reincidências: count, Finalizados: finishedCount };
    });
  }, [safeReincidences, safeServices, year]);

  // ── 8. Segment Ranking ────────────────────────────────────────────────────
  const segmentRanking = useMemo((): SegmentStat[] => {
    const counts = new Map<SegmentType, number>();
    filteredReincidences.forEach((r) => {
      r.affected_segments?.forEach((seg) => {
        counts.set(seg, (counts.get(seg) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([seg, count]) => ({ seg, label: SEGMENT_LABELS[seg] ?? seg, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredReincidences]);

  const maxSegCount = segmentRanking[0]?.count ?? 1;
  const criticalSegment = segmentRanking.length > 0 ? segmentRanking[0] : null;

  // ── 9. Recent Reincidences Table Filtered ─────────────────────────────────
  const recentReincidencesFiltered = useMemo(() => {
    return filteredReincidences.filter(r => {
      if (tableMonth !== null) {
        const m = new Date(r.opened_at).getMonth() + 1;
        if (m !== tableMonth) return false;
      }
      if (tableTeamId !== 'all' && r.assigned_team_id !== tableTeamId) return false;
      if (tableSegment !== 'all' && !r.affected_segments?.includes(tableSegment as SegmentType)) return false;
      if (tableStatus !== 'all' && r.status !== tableStatus) return false;
      return true;
    }).sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
  }, [filteredReincidences, tableMonth, tableTeamId, tableSegment, tableStatus]);


  // ─── Render ───────────────────────────────────────────────────────────────
  const periodLabel = month !== null ? `${MONTHS_LABELS[month - 1]}/${year}` : `${year}`;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Qualidade e Reincidências"
        subtitle="Análise de retrabalho, índice de qualidade e performance das equipes"
        onRefresh={handleRefresh}
        loading={loading}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          {/* ── ALERTA EQUIPES CRÍTICAS E SEGMENTO ──────────────────────── */}
          <AnimatePresence>
            {(criticalTeams.length > 0 || criticalSegment) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{   opacity: 0, y: -8  }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                {criticalTeams.length > 0 && (
                  <div className="glass-card p-4 border border-red-500/30 bg-red-500/5 flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-400 mb-2">
                        Equipes com Atenção — Taxa superior a 15%
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {criticalTeams.map((s) => (
                          <div key={s.team.id} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.team.color }} />
                            <span className="text-sm text-white font-medium">{s.team.name}</span>
                            <span className="text-xs font-bold text-red-400">{s.reincidenceRate}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {criticalSegment && (
                  <div className="glass-card p-4 border border-orange-500/30 bg-orange-500/5 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-orange-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-400 mb-2">
                        Segmento Mais Crítico no Período
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5">
                          <span className="text-sm text-white font-medium">{criticalSegment.label}</span>
                          <span className="text-xs font-bold text-orange-400">{criticalSegment.count} ocorrências</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CARDS DE RESUMO ───────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4"
          >
            <SummaryCard
              icon={Repeat2}
              label="Reincidências"
              value={totalReincPeriod}
              sub={`${totalReincOpenPeriod} em andamento`}
              accent="purple"
              isNumber
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Taxa Geral"
              value={`${globalRate}%`}
              sub={`Em ${totalFinishedPeriod} finalizados`}
              accent={globalRate > 15 ? 'red' : globalRate > 8 ? 'orange' : 'green'}
            />
            <SummaryCard
              icon={ShieldCheck}
              label="Qualidade Global"
              value={`${globalQualityIndex.toFixed(1)}%`}
              sub={qualityLabel(globalQualityIndex)}
              accent={globalQualityIndex < 85 ? 'red' : globalQualityIndex < 90 ? 'orange' : 'green'}
            />
            <SummaryCard
              icon={TrendingUp}
              label="Melhor Equipe"
              value={bestTeam?.team.name ?? '—'}
              sub={bestTeam ? `${bestTeam.qualityIndex}% qualidade` : 'Sem dados'}
              accent="green"
            />
            <SummaryCard
              icon={TrendingDown}
              label="Equipe Crítica"
              value={worstTeam?.team.name ?? '—'}
              sub={worstTeam ? `${worstTeam.reincidenceRate}% taxa` : 'Sem dados'}
              accent="red"
            />
          </motion.div>

          {/* ── GRÁFICOS COMPLEMENTARES ────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Finalizados × Reincidências no Ano ({year})</h3>
              <p className="text-xs text-slate-500 mb-4">Comparativo mensal de volume geral</p>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyEvolution} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="Finalizados" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Reincidências" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Qualidade por Equipe no Período</h3>
              <p className="text-xs text-slate-500 mb-4">Índice de Qualidade vs Taxa de Reincidência (%)</p>
              {barChartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-600 text-sm">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Índice de Qualidade" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Taxa" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* ── RANKING COMPLETO (Tabela detalhada) ───────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Ranking de Equipes</h3>
                  <p className="text-xs text-slate-500">Ordenado por qualidade ({periodLabel})</p>
                </div>
                <Award size={16} className="text-yellow-400" />
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1a2744]/60">
                      <th className="text-left py-2 px-3 text-xs text-slate-500 font-medium">Equipe</th>
                      <th className="text-right py-2 px-3 text-xs text-slate-500 font-medium">Serv.</th>
                      <th className="text-right py-2 px-3 text-xs text-slate-500 font-medium">Reinc.</th>
                      <th className="text-right py-2 px-3 text-xs text-slate-500 font-medium">Taxa %</th>
                      <th className="text-right py-2 px-3 text-xs text-slate-500 font-medium">Índice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2744]/40">
                    {teamStats.map((stat) => {
                      const colors = qualityColor(stat.qualityIndex);
                      return (
                        <tr key={stat.team.id} className="hover:bg-[#0f1729]/60 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-500 w-4">{stat.rank}º</span>
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stat.team.color }} />
                              <span className="font-medium text-white text-xs truncate max-w-[100px]">{stat.team.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300 text-xs">{stat.completedServices}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`text-xs font-medium ${stat.reincidences > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {stat.reincidences}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`text-xs font-semibold ${colors.text}`}>{stat.reincidenceRate}%</span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-12 hidden sm:block h-1.5 bg-[#1a2744] rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${stat.qualityIndex}%` }} className="h-full rounded-full" style={{ backgroundColor: colors.bar }} />
                              </div>
                              <span className={`font-bold text-xs ${colors.text}`}>{stat.qualityIndex}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* ── SEGMENTOS COM MAIS PROBLEMAS ───────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Segmentos Problemáticos</h3>
                  <p className="text-xs text-slate-500">Volume de reincidências por categoria</p>
                </div>
                <Filter size={16} className="text-indigo-400" />
              </div>
              {segmentRanking.length === 0 ? (
                <p className="text-sm text-slate-600 text-center py-8">Nenhum dado no período</p>
              ) : (
                <div className="space-y-3">
                  {segmentRanking.map((item, idx) => (
                    <motion.div key={item.seg} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-5 text-right shrink-0">{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-300">{item.label}</span>
                          <span className="text-xs font-bold text-white">{item.count}</span>
                        </div>
                        <div className="h-1.5 bg-[#1a2744] rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(item.count / maxSegCount) * 100}%` }} transition={{ delay: 0.2 + idx * 0.05, duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full bg-indigo-500" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── REINCIDÊNCIAS RECENTES COM FILTROS ───────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Análise de Reincidências ({recentReincidencesFiltered.length})</h3>
                <p className="text-xs text-slate-500">Detalhamento das ocorrências no período</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <select value={tableMonth ?? 'all'} onChange={(e) => setTableMonth(e.target.value === 'all' ? null : Number(e.target.value))} className="bg-[#0f1729] border border-[#1e2d4d] rounded-lg px-2 py-1.5 text-xs text-slate-300">
                  <option value="all">Todos os meses</option>
                  {MONTHS_LABELS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={tableTeamId} onChange={(e) => setTableTeamId(e.target.value)} className="bg-[#0f1729] border border-[#1e2d4d] rounded-lg px-2 py-1.5 text-xs text-slate-300">
                  <option value="all">Todas as Equipes</option>
                  {safeTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select value={tableSegment} onChange={(e) => setTableSegment(e.target.value)} className="bg-[#0f1729] border border-[#1e2d4d] rounded-lg px-2 py-1.5 text-xs text-slate-300">
                  <option value="all">Todos os Segmentos</option>
                  {Object.entries(SEGMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={tableStatus} onChange={(e) => setTableStatus(e.target.value)} className="bg-[#0f1729] border border-[#1e2d4d] rounded-lg px-2 py-1.5 text-xs text-slate-300">
                  <option value="all">Todos os Status</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
            </div>

            {recentReincidencesFiltered.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-8">Nenhuma reincidência encontrada com os filtros selecionados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1a2744]/60">
                      <th className="text-left py-2 px-3 text-xs text-slate-500 font-medium">Data</th>
                      <th className="text-left py-2 px-3 text-xs text-slate-500 font-medium">Cliente</th>
                      <th className="text-left py-2 px-3 text-xs text-slate-500 font-medium hidden sm:table-cell">Serviço</th>
                      <th className="text-left py-2 px-3 text-xs text-slate-500 font-medium hidden md:table-cell">Equipe</th>
                      <th className="text-left py-2 px-3 text-xs text-slate-500 font-medium hidden lg:table-cell">Segmentos</th>
                      <th className="text-left py-2 px-3 text-xs text-slate-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2744]/40">
                    {recentReincidencesFiltered.map((r) => {
                      const svc = r.service ?? safeServices.find((s) => s.id === r.service_id);
                      return (
                        <tr key={r.id} className="hover:bg-[#0f1729]/60 transition-colors">
                          <td className="py-3 px-3 text-slate-400 whitespace-nowrap text-xs">{formatDate(r.opened_at)}</td>
                          <td className="py-3 px-3"><p className="text-white font-medium text-xs truncate max-w-[150px]">{svc?.client_name ?? '—'}</p></td>
                          <td className="py-3 px-3 hidden sm:table-cell">{svc ? <span className="text-slate-400 text-xs font-mono">#{svc.service_number}</span> : <span className="text-slate-600">—</span>}</td>
                          <td className="py-3 px-3 hidden md:table-cell">
                            {r.assigned_team ? (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.assigned_team.color }} />
                                <span className="text-slate-300 text-xs truncate max-w-[120px]">{r.assigned_team.name}</span>
                              </div>
                            ) : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="py-3 px-3 hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {r.affected_segments?.slice(0, 2).map((seg) => (
                                <span key={seg} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">{segmentLabel(seg)}</span>
                              ))}
                              {(r.affected_segments?.length ?? 0) > 2 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">+{r.affected_segments!.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {r.status === 'finalizado' ? <span className="badge-green text-[10px]">Finalizada</span> : <span className="badge-blue text-[10px]">Em Andamento</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}