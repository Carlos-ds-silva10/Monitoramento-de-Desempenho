import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Service, ServiceStatus } from '../types';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('service_number', { ascending: false });
    if (error) setError(error.message);
    else setServices(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

 const createService = async (
  clientName: string,
  openedAt: string,
  serviceType: 'instalacao' | 'manutencao',
  segments: string[]
) => {
  const { error } = await supabase
    .from('services')
    .insert({
      client_name: clientName,
      service_type: serviceType,
      opened_at: openedAt,
      segments,
      status: 'em_andamento',
    });

  if (error) throw new Error(error.message);

  await fetchServices();
};

  const updateService = async (
    id: string,
    data: { client_name?: string; service_type?: 'instalacao' | 'manutencao'; status?: ServiceStatus; closed_at?: string | null; opened_at?: string;}
  ) => {
    const { error } = await supabase.from('services').update(data).eq('id', id);
    if (error) throw new Error(error.message);
    await fetchServices();
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchServices();
  };

  return { services, loading, error, fetchServices, createService, updateService, deleteService };
}
