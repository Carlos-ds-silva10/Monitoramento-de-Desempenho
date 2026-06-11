import type { Team, Service, TeamVisit, TeamStats, ServiceWithStats } from '../types';

export interface TeamProductionStats {
  team: Team;
  installations: number;
  maintenances: number;
  total: number;
}

export function calcTechnicalDays(visits: TeamVisit[]): number {
  const uniqueDates = new Set(visits.map((v) => v.visit_date));
  return uniqueDates.size;
}

export function buildServiceStats(
  service: Service,
  visits: TeamVisit[],
  teams: Team[]
): ServiceWithStats {
  const serviceVisits = visits.filter((v) => v.service_id === service.id);
  const technicalDays = calcTechnicalDays(serviceVisits);
  const teamIds = [...new Set(serviceVisits.map((v) => v.team_id))];
  const participatingTeams = teams.filter((t) => teamIds.includes(t.id));

  return {
    ...service,
    technical_days: technicalDays,
    participating_teams: participatingTeams,
    visits: serviceVisits,
  };
}

export function buildTeamStats(teams: Team[], services: Service[], visits: TeamVisit[]): TeamStats[] {
  const finishedServices = services.filter((s) => s.status === 'finalizado');

  const rawStats = teams.map((team) => {
    const teamVisits = visits.filter((v) => v.team_id === team.id);
    const participatedServiceIds = [...new Set(teamVisits.map((v) => v.service_id))];
    const completedServices = finishedServices.filter((s) =>
      participatedServiceIds.includes(s.id)
    );

    const totalTechnicalDays = completedServices.reduce((acc, service) => {
      const serviceVisits = visits.filter((v) => v.service_id === service.id);
      return acc + calcTechnicalDays(serviceVisits);
    }, 0);

    const avgDays =
      completedServices.length > 0 ? totalTechnicalDays / completedServices.length : 0;

    return {
      team,
      completed_services: completedServices.length,
      total_technical_days: totalTechnicalDays,
      avg_days_per_service: avgDays,
      performance_score: 0,
      rank: 0,
      category: 'average' as const,
    };
  });

  const withServices = rawStats.filter((s) => s.completed_services > 0);
  const withoutServices = rawStats.filter((s) => s.completed_services === 0);

  withServices.sort((a, b) => a.avg_days_per_service - b.avg_days_per_service);

  
   const categorized = withServices.map((stat, i) => {
  const bestAvgDays = withServices[0]?.avg_days_per_service ?? 0;

  const performance_score =
    stat.avg_days_per_service === bestAvgDays
      ? 100
      : Math.round((bestAvgDays / stat.avg_days_per_service) * 100);

  let category: 'fast' | 'average' | 'slow';

  if (performance_score >= 80) {
    category = 'fast';
  } else if (performance_score >= 40) {
    category = 'average';
  } else{
    category = 'slow';
  }

  return {
    ...stat,
    rank: i + 1,
    category,
    performance_score,
  };
});

  return [
    ...categorized,
    ...withoutServices.map((s, i) => ({
      ...s,
      rank: categorized.length + i + 1,
      category: 'average' as const,
      performance_score: 0,
    })),
  ];
}

export function getMonthlyEvolution(
  services: Service[],
  visits: TeamVisit[]
): { month: string; completed: number; avg_days: number }[] {
  const finishedServices = services.filter((s) => s.status === 'finalizado' && s.closed_at);

  const byMonth: Record<string, Service[]> = {};
  finishedServices.forEach((s) => {
    const key = s.closed_at!.slice(0, 7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(s);
  });

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, monthServices]) => {
      const totalDays = monthServices.reduce((acc, s) => {
        const sv = visits.filter((v) => v.service_id === s.id);
        return acc + calcTechnicalDays(sv);
      }, 0);
      return {
        month: formatMonth(month),
        completed: monthServices.length,
        avg_days: monthServices.length > 0 ? Math.round((totalDays / monthServices.length) * 10) / 10 : 0,
      };
    });
}
   function formatMonth(ym: string): string {
    const [year, month] = ym.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
     return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
}
   export function getTeamProductionStats(
    teams: Team[],
    services: Service[],
    visits: TeamVisit[]
  ): TeamProductionStats[] {
    return teams.map((team) => {
      const teamVisits = visits.filter((v) => v.team_id === team.id);
      const serviceIds = [...new Set(teamVisits.map((v) => v.service_id))];
      const teamServices = services.filter((s) =>
      serviceIds.includes(s.id)
    );
    const installations = teamServices.filter(
       (s) => s.service_type === 'instalacao').length;
       const maintenances = teamServices.filter((s) => s.service_type === 'manutencao' ).length;
    return {
      team,
      installations,
      maintenances,
      total: installations + maintenances,
    };
    
  });
}
export function getCurrentWeekRange() {
  const now = new Date();

  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;

  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
export function getWeeklyProductionStats(
  teams: Team[],
  services: Service[],
  visits: TeamVisit[]
) {
  const { start, end } = getCurrentWeekRange();
  

  return teams.map((team) => {
const teamVisits = visits.filter((visit) => {
  if (visit.team_id !== team.id) return false;

  const visitDate = new Date(
    visit.visit_date + "T12:00:00"
  );

  const inWeek =
    visitDate >= start && visitDate <= end;

  return inWeek;
});

    const serviceIds = [...new Set(teamVisits.map(v => v.service_id))];
  
    const weekServices = services.filter(s =>
      serviceIds.includes(s.id)
    );

    const installations = weekServices.filter(
      s => s.service_type === 'instalacao'
    ).length;

    const maintenances = weekServices.filter(
      s => s.service_type === 'manutencao'
    ).length;

    return {
      team,
      installations,
      maintenances,
      total: installations + maintenances,
    };
  });
}
  export function getMonthlyProductionStats(
    teams: Team[],
    services: Service[],
    visits: TeamVisit[]) {const months = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',];
    return teams.map((team) => {
    const result: any = { team: team.name,};
    months.forEach((month) => { result[month] = 0;});
    const teamVisits = visits.filter((v) => v.team_id === team.id);
    teamVisits.forEach((visit) => { 
      const service = services.find((s) => s.id === visit.service_id);
      if (!service) return;
      const date = new Date(visit.visit_date);
      const monthIndex = date.getMonth();
      result[months[monthIndex]] += 1;
    });
    return result;
  });
}