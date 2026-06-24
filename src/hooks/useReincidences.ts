import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ReincidenceStatus, SegmentType, ServiceReincidence } from '../types';

type ReincidenceInput = {
  service_id: string;
  title: string;
  description: string;
  affected_segments: SegmentType[];
  opened_at: string;
  assigned_team_id?: string | null;
  origin_visit_id?: string | null;
};

type ReincidenceUpdate = Partial<
  Pick<
    ServiceReincidence,
    | 'service_id'
    | 'title'
    | 'description'
    | 'affected_segments'
    | 'status'
    | 'opened_at'
    | 'closed_at'
  >
>;

export function useReincidences() {
  const [reincidences, setReincidences] = useState<ServiceReincidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const findLastResponsibleVisit = async (
  serviceId: string,
  segments: string[]
) => {
  const { data, error } = await supabase
    .from('team_visits')
    .select('*')
    .eq('service_id', serviceId)
    .order('visit_date', { ascending: false });

  if (error) throw error;

  const visit = data?.find((v) =>
    v.segments_worked?.some((segment: string) =>
      segments.includes(segment)
    )
  );

  return visit ?? null;
};

  const fetchReincidences = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('service_reincidences')
      .select(` *, service:services(*), assigned_team:teams(*)`)
      .order('opened_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else setReincidences((data ?? []) as ServiceReincidence[]);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReincidences();
  }, [fetchReincidences]);

  const createReincidence = async (input: ReincidenceInput) => {
    console.table({
    service_id: input.service_id,
    assigned_team_id: input.assigned_team_id,
    origin_visit_id: input.origin_visit_id,
  });
    const { error } = await supabase.from('service_reincidences').insert({
  service_id: input.service_id,
  title: input.title,
  description: input.description,
  affected_segments: input.affected_segments,
  opened_at: input.opened_at,
  status: 'em_andamento',
  closed_at: null,

  assigned_team_id: input.assigned_team_id ?? null,
  origin_visit_id: input.origin_visit_id ?? null,
})
    if (error) throw new Error(error.message);
    await fetchReincidences();
  };

  const updateReincidence = async (id: string, data: ReincidenceUpdate) => {
    const { error } = await supabase
      .from('service_reincidences')
      .update(data)
      .eq('id', id);

    if (error) throw new Error(error.message);
    await fetchReincidences();
  };

  const updateReincidenceStatus = async (
    id: string,
    status: ReincidenceStatus,
    closedAt: string | null
  ) => {
    await updateReincidence(id, {
      status,
      closed_at: status === 'finalizado' ? closedAt : null,
    });
  };

  const deleteReincidence = async (id: string) => {
    const { error } = await supabase
      .from('service_reincidences')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    await fetchReincidences();
  };

  return {
  reincidences,
  loading,
  error,
  fetchReincidences,
  createReincidence,
  updateReincidence,
  updateReincidenceStatus,
  deleteReincidence,
  findLastResponsibleVisit,
};
}
