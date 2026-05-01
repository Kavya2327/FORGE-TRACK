import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  CheckSquare
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

const chartData = [
  { day: 'Mon', rate: 85 },
  { day: 'Tue', rate: 88 },
  { day: 'Wed', rate: 76 },
  { day: 'Thu', rate: 92 },
  { day: 'Fri', rate: 84 },
  { day: 'Sat', rate: 89 },
  { day: 'Sun', rate: 95 },
]

const chartConfig = {
  rate: {
    label: "Attendance Rate",
    color: "hsl(var(--primary))",
  },
}

const StatCard = ({ label, value, trend, icon: Icon, colorClass }) => (
  <Card className="bg-surface border-border-subtle hover:border-accent-glow/30 transition-all group">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-micro font-bold uppercase tracking-wider text-fg-tertiary">
        {label}
      </CardTitle>
      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-display-sm">{value}</div>
      {trend && (
        <p className="text-xs text-success flex items-center gap-1 mt-1 font-medium">
          <TrendingUp className="w-3 h-3" /> {trend} since last week
        </p>
      )}
    </CardContent>
  </Card>
)

const Dashboard = () => {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgAttendance: '0%',
    activeStudents: 0,
    lastSession: '—'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const { count: sessionsCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true })
      const { count: studentsCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true)
      const { data: lastSessionData } = await supabase.from('sessions').select('date').order('date', { ascending: false }).limit(1)

      setStats({
        totalSessions: sessionsCount || 0,
        avgAttendance: '84.2%', 
        activeStudents: studentsCount || 0,
        lastSession: lastSessionData?.[0]?.date || '—'
      })
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-label text-accent-glow font-bold mb-2 tracking-[0.2em]">Management Console</p>
          <h1 className="text-display-lg">Welcome Back, {profile?.display_name?.split(' ')[0]}</h1>
          <p className="text-body text-fg-secondary mt-1">
            You have marked attendance for <span className="text-fg-primary font-bold">12</span> sessions this month.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-surface-raised border border-border-default px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface transition-all">
            View Reports
          </button>
          <button className="bg-fg-primary text-void px-5 py-2 rounded-lg text-sm font-bold hover:bg-fg-primary/90 transition-all flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule Session
          </button>
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Sessions" value={stats.totalSessions} icon={Calendar} colorClass="bg-accent-glow" />
        <StatCard label="Avg Attendance" value={stats.avgAttendance} trend="+2.4%" icon={TrendingUp} colorClass="bg-success" />
        <StatCard label="Active Students" value={stats.activeStudents} icon={Users} colorClass="bg-blue-500" />
        <StatCard label="Last Session" value={stats.lastSession} icon={Clock} colorClass="bg-warning" />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Attendance Trend Chart */}
        <Card className="col-span-12 lg:col-span-8 bg-surface border-border-subtle">
          <CardHeader>
            <CardTitle className="text-h3">Attendance Trends</CardTitle>
            <CardDescription>Daily attendance rate for the current week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#8A8A94', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#8A8A94', fontSize: 12 }} 
                      domain={[0, 100]}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#0B0B11" }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Today's Status */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="bg-gradient-to-br from-surface to-surface-raised border-accent-glow/20">
            <CardHeader>
              <CardTitle className="text-h3">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <button className="w-full bg-fg-primary text-void p-4 rounded-xl font-bold flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-5 h-5" />
                  Mark Attendance
                </div>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
              <button className="w-full bg-surface-inset border border-border-subtle p-4 rounded-xl font-medium text-fg-secondary hover:text-fg-primary hover:border-accent-glow/30 transition-all flex items-center gap-3">
                <Users className="w-5 h-5" />
                Add New Student
              </button>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border-subtle">
            <CardHeader>
              <CardTitle className="text-h3">System Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { type: 'warning', text: '3 students below 75% attendance', icon: AlertCircle },
                { type: 'success', text: 'CSV Import successful', icon: CheckCircle },
              ].map((note, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${note.type === 'warning' ? 'bg-warning-bg border-warning-border text-warning' : 'bg-success-bg border-success-border text-success'}`}>
                  <note.icon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{note.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
