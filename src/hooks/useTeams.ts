import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Team } from '../types';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    if (error) setError(error.message);
    else setTeams(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const createTeam = async (name: string, color: string) => {
    const { error } = await supabase.from('teams').insert({ name, color });
    if (error) throw new Error(error.message);
    await fetchTeams();
  };

  const updateTeam = async (id: string, name: string, color: string) => {
    const { error } = await supabase.from('teams').update({ name, color }).eq('id', id);
    if (error) throw new Error(error.message);
    await fetchTeams();
  };

  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchTeams();
  };

  return { teams, loading, error, fetchTeams, createTeam, updateTeam, deleteTeam };
}

