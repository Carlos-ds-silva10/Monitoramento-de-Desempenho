import { useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import { getMonthlyProductionStats } from '../lib/analytics';
import type { Team, Service, TeamVisit } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LabelList,} from "recharts";

interface Props {
  teams: Team[];
  services: Service[];
  visits: TeamVisit[];
  loading: boolean;
  onRefresh: () => void;
}

const months = [
  { key: 'Jan', label: 'Janeiro' },
  { key: 'Fev', label: 'Fevereiro' },
  { key: 'Mar', label: 'Março' },
  { key: 'Abr', label: 'Abril' },
  { key: 'Mai', label: 'Maio' },
  { key: 'Jun', label: 'Junho' },
  { key: 'Jul', label: 'Julho' },
  { key: 'Ago', label: 'Agosto' },
  { key: 'Set', label: 'Setembro' },
  { key: 'Out', label: 'Outubro' },
  { key: 'Nov', label: 'Novembro' },
  { key: 'Dez', label: 'Dezembro' },
];

export default function MonthlyProduction({
  teams,
  services,
  visits,
  loading,
  onRefresh,
}: Props) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const years = [ ...new Set( services.map((service) => new Date(service.created_at).getFullYear())), ].sort((a, b) => b - a);
  const filteredServices = useMemo(()=> services.filter((service) => new Date(service.created_at).getFullYear() === selectedYear), [services, selectedYear]);
  const monthlyData = useMemo(()=>getMonthlyProductionStats( teams, filteredServices, visits ), [teams, filteredServices, visits]);
    
  /*Grafico que compara as equipes*/
  const chartData = months.map((month) => {
  const row: any = {
    month: month.label,
  };
  monthlyData.forEach((team) => {
    row[team.team] =
      team[month.key as keyof typeof team];
  });
  return row;});
  /*Ranck mensal*/
  const ranking = [...monthlyData]
  .map((team) => ({
    ...team,
    total:
      team.Jan +
      team.Fev +
      team.Mar +
      team.Abr +
      team.Mai +
      team.Jun +
      team.Jul +
      team.Ago +
      team.Set +
      team.Out +
      team.Nov +
      team.Dez,
  }))
  .sort((a, b) => b.total - a.total);
  /*EQUIPE DESTAQUE DO ANO*/
    const championTeam = ranking[0];
    const totalServices = ranking.reduce((acc, team) => acc + team.total,0);
    const bestMonthOverall = months.reduce((best, month) => {
    const totalMonth = monthlyData.reduce((acc, team) => {
    const value = team[month.key as keyof typeof team]; return acc + (typeof value === "number" ? value : 0);}, 0);
    return totalMonth > best.total
      ? { month: month.label, total: totalMonth }
      : best;},
  { month: "", total: 0 });
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Produção Mensal"
        subtitle="Histórico mensal de instalações e manutenções"
        onRefresh={onRefresh}
        loading={loading}
      />
      {/* FILTRO DE ANO */}
      <div className="p-6 pb-0">
        <div className="flex items-center gap-3">
        <span className="text-slate-400 text-sm">Ano:</span>
    <select
      value={selectedYear}
      onChange={(e) => setSelectedYear(Number(e.target.value))}
      className="bg-[#080d1a] border border-[#1a2744] rounded-xl px-4 py-2 text-white">
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
      </select>
      </div></div>
      <div className="p-6 pb-0">
        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
        <p className="text-slate-400 text-sm mb-2">
            🏆 Equipe Campeã</p>
        <h3 className="text-xl font-bold text-yellow-400">
             {championTeam?.team}</h3>
        <p className="text-slate-500 text-sm mt-1"> {championTeam?.total} serviços </p>
            </div>
            <div className="glass-card p-5">
               <p className="text-slate-400 text-sm mb-2">
                    📈 Melhor Mês</p>
                <h3 className="text-xl font-bold text-blue-400">{bestMonthOverall.month}</h3>
                <p className="text-slate-500 text-sm mt-1">
                    {bestMonthOverall.total} serviços</p>
            </div>
    <div className="glass-card p-5">
      <p className="text-slate-400 text-sm mb-2">
        📊 Total de Serviços
      </p>
      <h3 className="text-xl font-bold text-emerald-400">
        {totalServices}
      </h3>
      <p className="text-slate-500 text-sm mt-1">
        Produção anual
      </p>
    </div>
  </div>
</div>
{/*Comparativo */}
    <div className="p-6 pt-4">
  <div className="glass-card p-6">
    <h2 className="text-lg font-semibold text-white mb-4">
      Comparativo Mensal das Equipes
    </h2>
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1a2744"/>
          <XAxis
            dataKey="month"
            stroke="#94a3b8"
          />
          <YAxis
            stroke="#94a3b8"
          />
          <Tooltip />
          <Legend />
          <Legend />
          {monthlyData.map((teamData) => {
            const teamInfo = teams.find((t) => t.name === teamData.team);
            return (
            <Bar
             key={teamData.team}
             dataKey={teamData.team}
             fill={teamInfo?.color || "#3b82f6"}
             radius={[4, 4, 0, 0]}>
                <LabelList
                dataKey={teamData.team}
                position="top"
                fill="#cbd5e1"
                fontSize={12}/>
            </Bar>
        );
        })}
          </BarChart>
          </ResponsiveContainer>
          </div>
          </div>
          </div>
      <div className="p-6">
        <div className="glass-card p-5 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Ranking Anual</h2>
      <div className="space-y-3">
        {ranking.map((team, index) => (
            <div key={team.team} className="flex items-center justify-between p-3 rounded-xl bg-[#080d1a]/60 border border-[#1a2744]/40">
          <div className="flex items-center gap-3">
            <span className="text-lg">
              {index === 0
                ? "🥇"
                : index === 1
                ? "🥈"
                : index === 2
                ? "🥉"
                : "🏅"}
            </span>
            <span className="font-medium text-white">
              {team.team}
            </span>
          </div>
          <span className="text-emerald-400 font-bold">
            {team.total}
          </span>
        </div>
      ))}
    </div>
  </div>
</div>

      <div className="glass-card p-6 overflow-auto">
        <div className="space-y-4">
          {monthlyData.map((team) => {
            
            // Calcula o total dinamicamente usando o array de meses
            const total = months.reduce((acc, month) => {
              const val = team[month.key as keyof typeof team];
              return acc + (typeof val === 'number' ? val : 0);
            }, 0);
            const monthsData = [
                { name: "Janeiro", value: team.Jan },
                { name: "Fevereiro", value: team.Fev },
                { name: "Março", value: team.Mar },
                { name: "Abril", value: team.Abr },
                { name: "Maio", value: team.Mai },
                { name: "Junho", value: team.Jun },
                { name: "Julho", value: team.Jul },
                { name: "Agosto", value: team.Ago },
                { name: "Setembro", value: team.Set },
                { name: "Outubro", value: team.Out },
                { name: "Novembro", value: team.Nov },
                { name: "Dezembro", value: team.Dez },];
                const bestMonth = monthsData.sort((a, b) => b.value - a.value)[0];
            return (
              <div key={team.team} className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                        {team.team}
                        </h3>
                        {bestMonth.value > 0 && (
                            <p className="text-sm text-yellow-400 mt-1">
                                🏆 Melhor mês: {bestMonth.name} ({bestMonth.value} serviços)
                                </p>)}
                                </div>
                  <span className="text-emerald-400 font-bold">
                    Total: {total}
                  </span>
                </div>

                <div className="space-y-3">
                  {months.map((month) => {
                    const value = team[month.key as keyof typeof team];

                    // Pula meses sem produção (0 ou não definidos)
                    if (typeof value !== 'number' || value === 0) return null;

                    return (
                      <div key={month.key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{month.label}</span>
                          <span className="text-white font-medium">{value}</span>
                        </div>

                        <div className="h-2 bg-[#1a2744] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{
                              width: `${Math.min(Math.max(value * 20, 10), 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}