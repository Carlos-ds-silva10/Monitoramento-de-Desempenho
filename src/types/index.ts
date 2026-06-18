export type ServiceStatus = 'em_andamento' | 'finalizado';
export type VisitType = 'inicio' | 'continuacao' | 'finalizacao';
export type SegmentType =
  | 'cameras'
  | 'portao'
  | 'alarme'
  | 'cerca_eletrica'
  | 'controle_acesso'
  | 'rede'
  | 'interfone'
  | 'outro';

export interface Team {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Service {
  id: string;
  service_number: number;
  client_name: string;
  service_type: 'instalacao' | 'manutencao';

  segments: SegmentType[];

  status: ServiceStatus;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
}

export interface TeamVisit {
  id: string;
  service_id: string;
  team_id: string;

  segments_worked: SegmentType[];

  visit_date: string;
  visit_type: VisitType;
  notes: string;
  created_at: string;
  team?: Team;
  service?: Service;
}

export interface TeamStats {
  team: Team;
  completed_services: number;
  total_technical_days: number;
  avg_days_per_service: number;
  performance_score: number;
  rank: number;
  category: 'fast' | 'average' | 'slow';
}

export interface ServiceWithStats extends Service {
  technical_days: number;
  participating_teams: Team[];
  visits: TeamVisit[];
}
