import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TeamVisit, VisitType } from '../types';

export function useVisits(serviceId?: string) {
  const [visits, setVisits] = useState<TeamVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('team_visits')
      .select('*, team:teams(*), service:services(*)')
      .order('visit_date', { ascending: false });
    if (serviceId) query = query.eq('service_id', serviceId);
    const { data, error } = await query;
    if (error) setError(error.message);
    else setVisits(data ?? []);
    setLoading(false);
  }, [serviceId]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const createVisit = async (
    visitServiceId: string,
    teamId: string,
    visitDate: string,
    visitType: VisitType,
    notes: string,
    segments: string[]
  ) => {

    const { error } = await supabase.from('team_visits').insert({
      service_id: visitServiceId,
      team_id: teamId,
      visit_date: visitDate,
      visit_type: visitType,
      notes,
      segments_worked: segments,
    });
    if (error) throw new Error(error.message);
    await fetchVisits();
  };

  const updateVisit = async (
  id: string,
  data: {
    visit_date?: string;
    visit_type?: VisitType;
    notes?: string;
    segments_worked?: string[];
  }
) => {
    const { error } = await supabase.from('team_visits').update(data).eq('id', id);
    if (error) throw new Error(error.message);
    await fetchVisits();
  };

  const deleteVisit = async (id: string) => {
    const { error } = await supabase.from('team_visits').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchVisits();
  };

  return { visits, loading, error, fetchVisits, createVisit, updateVisit, deleteVisit };
}
