import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from "date-fns";

export interface AnalyticsData {
  dailyLeads: { date: string; count: number }[];
  sources: { name: string; value: number }[];
  countries: { name: string; value: number }[];
  ticketTypes: { name: string; value: number }[];
  attendanceRate: { name: string; value: number }[];
}

export const useAnalytics = (eventId?: string) => {
  return useQuery({
    queryKey: ["analytics", eventId],
    queryFn: async (): Promise<AnalyticsData> => {
      let query = supabase.from("guests").select("created_at, custom_fields, ticket_type, checked_in");

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data: guests, error } = await query;

      if (error) throw error;

      // 1. Daily Leads (Last 30 days)
      const last30Days = eachDayOfInterval({
        start: startOfDay(subDays(new Date(), 29)),
        end: startOfDay(new Date()),
      });

      const dailyMap = new Map<string, number>();
      last30Days.forEach((date) => dailyMap.set(format(date, "MMM dd"), 0));

      guests?.forEach((guest) => {
        const dateKey = format(parseISO(guest.created_at), "MMM dd");
        if (dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
        }
      });

      const dailyLeads = Array.from(dailyMap.entries()).map(([date, count]) => ({
        date,
        count,
      }));

      // 2. Lead Sources
      const sourceMap = new Map<string, number>();
      guests?.forEach((guest) => {
        const fields = guest.custom_fields as any;
        const source = fields?.source || "Unknown";
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });

      const sources = Array.from(sourceMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // 3. Countries of Interest
      const countryMap = new Map<string, number>();
      guests?.forEach((guest) => {
        const fields = guest.custom_fields as any;
        const country = fields?.country_of_interest || fields?.country || "Unknown";
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      });

      const countries = Array.from(countryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // 4. Ticket Types
      const ticketTypeMap = new Map<string, number>();
      guests?.forEach((guest) => {
        const type = guest.ticket_type || "Standard";
        ticketTypeMap.set(type, (ticketTypeMap.get(type) || 0) + 1);
      });

      const ticketTypes = Array.from(ticketTypeMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));

      // 5. Attendance Rate
      const checkedInCount = guests?.filter((g) => g.checked_in).length || 0;
      const totalCount = guests?.length || 0;
      const attendanceRate = [
        { name: "Checked In", value: checkedInCount },
        { name: "Pending", value: totalCount - checkedInCount },
      ];

      return {
        dailyLeads,
        sources,
        countries,
        ticketTypes,
        attendanceRate,
      };
    },
  });
};
