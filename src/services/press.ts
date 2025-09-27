import { supabase } from "@/integrations/supabase/client";

export interface PressArticle {
  id: string;
  title: string;
  summary: string | null;
  vehicle: string;
  logo_url: string | null;
  url: string;
  published_at: string;
  created_at: string;
}

export interface PressFilters {
  vehicle?: string;
  period?: number; // days
}

export async function fetchPressArticles(filters: PressFilters = {}) {
  let query = supabase
    .from('press_mentions_published_v')
    .select('*');

  // Filter by vehicle
  if (filters.vehicle && filters.vehicle !== 'all') {
    query = query.eq('vehicle', filters.vehicle);
  }

  // Filter by period
  if (filters.period) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - filters.period);
    query = query.gte('published_at', startDate.toISOString());
  }

  const { data, error } = await query.order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching press articles:', error);
    throw error;
  }

  return data as PressArticle[];
}

export async function getVehicles() {
  const { data, error } = await supabase
    .from('press_mentions')
    .select('vehicle')
    .eq('status', 'published')
    .order('vehicle');

  if (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }

  // Get unique vehicles
  const uniqueVehicles = [...new Set(data.map(item => item.vehicle))];
  return uniqueVehicles;
}