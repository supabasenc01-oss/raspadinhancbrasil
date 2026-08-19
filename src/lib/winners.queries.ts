import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const publicWinnersQuery = queryOptions({
  queryKey: ['winners', 'public'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('winners' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    return data as any[];
  },
  staleTime: 1000 * 60, // 1 minute
});
