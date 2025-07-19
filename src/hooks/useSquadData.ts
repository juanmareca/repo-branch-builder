import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Person, SquadLead } from '../types';

export const useSquadData = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [squadLeads, setSquadLeads] = useState<SquadLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersons = async () => {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPersons(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching persons');
    }
  };

  const fetchSquadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('squad_leads')
        .select('*')
        .order('name');

      if (error) throw error;
      setSquadLeads(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching squad leads');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPersons(), fetchSquadLeads()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const addPersons = async (newPersons: Omit<Person, 'id'>[]) => {
    try {
      const { error } = await supabase
        .from('persons')
        .insert(newPersons);

      if (error) throw error;
      await fetchPersons();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding persons');
      return false;
    }
  };

  const getPersonsBySquadLead = (squadLeadName: string) => {
    return persons.filter(person => person.squad_lead === squadLeadName);
  };

  return {
    persons,
    squadLeads,
    loading,
    error,
    addPersons,
    getPersonsBySquadLead,
    refetch: () => Promise.all([fetchPersons(), fetchSquadLeads()])
  };
};