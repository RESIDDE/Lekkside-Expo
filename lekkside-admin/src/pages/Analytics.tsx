import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Users, 
  Globe, 
  Calendar,
  Filter,
  CheckCircle2,
  Clock
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useEvents } from "@/hooks/useEvents";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#6366F1"];

export default function Analytics() {
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const { data: events } = useEvents();
  const { data: analytics, isLoading } = useAnalytics(selectedEventId === "all" ? undefined : selectedEventId);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-primary mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Data Insights</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-semibold text-foreground tracking-tight">
              Advanced Analytics
            </h1>
            <p className="text-muted-foreground max-w-lg text-base sm:text-lg font-medium leading-relaxed">
              Deep dive into lead trends, demographics, and registration metrics.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-2xl border border-border/40">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-[200px] border-none bg-transparent focus:ring-0 h-8">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Skeleton className="h-[400px] col-span-full rounded-3xl" />
            <Skeleton className="h-[400px] rounded-3xl" />
            <Skeleton className="h-[400px] rounded-3xl" />
          </div>
        ) : analytics ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8"
          >
            {/* Daily Lead Trend - Full Width */}
            <motion.div variants={itemVariants} className="lg:col-span-4">
              <Card className="rounded-[2.5rem] border-border/40 bg-card/50 backdrop-blur-xl shadow-premium overflow-hidden border-none ring-1 ring-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-heading">Lead Acquisition Trend</CardTitle>
                      <CardDescription>Daily registration count over the last 30 days</CardDescription>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-2xl">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[350px] pr-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.dailyLeads}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '16px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCount)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Attendance Rate - Donut Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="rounded-[2.5rem] border-border/40 bg-card/50 backdrop-blur-xl shadow-premium overflow-hidden border-none ring-1 ring-border/50 h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-heading">Attendance Rate</CardTitle>
                      <CardDescription>Checked-in vs Pending Guests</CardDescription>
                    </div>
                    <div className="p-3 bg-green-500/5 rounded-2xl">
                      <Users className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[280px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.attendanceRate}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={10}
                        dataKey="value"
                        stroke="none"
                      >
                        {analytics.attendanceRate.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#10B981" : "hsl(var(--muted) / 0.5)"} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
                <div className="px-6 pb-8 text-center">
                   <div className="flex justify-center gap-8">
                     <div className="flex flex-col">
                        <span className="text-2xl font-bold text-foreground">{analytics.attendanceRate[0].value}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" /> Checked In
                        </span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-2xl font-bold text-foreground">{analytics.attendanceRate[1].value}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" /> Pending
                        </span>
                     </div>
                   </div>
                </div>
              </Card>
            </motion.div>

            {/* Countries of Interest - Bar Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <Card className="rounded-[2.5rem] border-border/40 bg-card/50 backdrop-blur-xl shadow-premium overflow-hidden border-none ring-1 ring-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-heading">Top Countries of Interest</CardTitle>
                      <CardDescription>Geographical lead distribution</CardDescription>
                    </div>
                    <div className="p-3 bg-blue-500/5 rounded-2xl">
                      <Globe className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.countries} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#3B82F6" 
                        radius={[0, 8, 8, 0]} 
                        barSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Lead Sources - Pie Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <Card className="rounded-[2.5rem] border-border/40 bg-card/50 backdrop-blur-xl shadow-premium overflow-hidden border-none ring-1 ring-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-heading">Lead Sources</CardTitle>
                      <CardDescription>Where your leads are coming from</CardDescription>
                    </div>
                    <div className="p-3 bg-purple-500/5 rounded-2xl">
                      <PieChartIcon className="w-5 h-5 text-purple-500" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.sources}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analytics.sources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ) : (
          <div className="text-center py-24 bg-card/30 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-border/60">
             <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
             <h3 className="text-xl font-semibold opacity-50">No data available for the selected filter</h3>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
