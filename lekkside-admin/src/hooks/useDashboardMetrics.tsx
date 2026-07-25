import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EventMetrics {
  attendees: number;
  leads: number;
}

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<Record<string, EventMetrics>>({});
  const [totalGuests, setTotalGuests] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Component Counts
  const [counts, setCounts] = useState({
    universities: 0,
    chats: 0,
    meetings: 0,
    applications: 0,
    screenings: 0,
  });

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);

        // We still need the rows to build the metrics map per event.
        // We will fetch up to 10000 rows to ensure we have enough data for the map,
        // but we will use the exact count query to get the true total.
        const { data: guests, error: guestsError } = await supabase
          .from('guests')
          .select('id, event_id')
          .limit(10000);

        if (guestsError) throw guestsError;

        const { data: leads, error: leadsError } = await (supabase as any)
          .from('booth_leads')
          .select('id, booth_id, exhibition_booths(event_id)')
          .limit(10000);

        if (leadsError) throw leadsError;

        // Fetch aggregate exact counts for the Bento Grid components and Totals
        const [
          { count: exactTotalGuests },
          { count: exactTotalLeads },
          { count: univCount },
          { count: chatCount },
          { count: meetingCount },
          { count: appCount },
          { count: screeningCount }
        ] = await Promise.all([
          supabase.from('guests').select('*', { count: 'exact', head: true }),
          (supabase as any).from('booth_leads').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'university'),
          (supabase as any).from('chat_conversations').select('*', { count: 'exact', head: true }),
          supabase.from('meeting_requests').select('*', { count: 'exact', head: true }),
          supabase.from('university_applications').select('*', { count: 'exact', head: true }),
          supabase.from('student_screenings').select('*', { count: 'exact', head: true }),
        ]);

        setTotalGuests(exactTotalGuests || 0);
        setTotalLeads(exactTotalLeads || 0);

        setCounts({
          universities: univCount || 0,
          chats: chatCount || 0,
          meetings: meetingCount || 0,
          applications: appCount || 0,
          screenings: screeningCount || 0,
        });

        const eventMap: Record<string, EventMetrics> = {};

        // Process guests
        guests?.forEach((g) => {
          if (!g.event_id) return;
          if (!eventMap[g.event_id]) eventMap[g.event_id] = { attendees: 0, leads: 0 };
          eventMap[g.event_id].attendees += 1;
        });

        // Process leads
        leads?.forEach((l: any) => {
          const eventId = l.exhibition_booths?.event_id;
          if (!eventId) return;
          if (!eventMap[eventId]) eventMap[eventId] = { attendees: 0, leads: 0 };
          eventMap[eventId].leads += 1;
        });

        setMetrics(eventMap);
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return { metrics, totalGuests, totalLeads, loading, counts };
}
