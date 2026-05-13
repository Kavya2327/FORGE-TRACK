import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Search, 
  User, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Users
} from 'lucide-react'

const StudentHistory = () => {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [sessions, setSessions] = useState([])
  const [attendance, setAttendance] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase.from('students').select('*').order('name')
      setStudents(data || [])
    }
    const fetchSessions = async () => {
      const { data } = await supabase.from('sessions').select('*').order('date', { ascending: false })
      setSessions(data || [])
    }
    fetchStudents()
    fetchSessions()
  }, [])



  const fetchStudentHistory = async (student) => {
    setLoading(true)
    setSelectedStudent(student)
    const { data } = await supabase
      .from('attendance')
      .select('*, sessions(*)')
      .eq('student_id', student.id)
      .order('session_id', { ascending: false })
    
    setAttendance(data || [])
    setLoading(false)
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.usn.toLowerCase().includes(search.toLowerCase())
  )

  const attendanceRate = attendance.length > 0 
    ? Math.round((attendance.filter(a => a.present).length / attendance.length) * 100)
    : 0

  const getStatusColor = (rate) => {
    if (rate >= 75) return 'text-success'
    if (rate >= 60) return 'text-warning'
    return 'text-danger'
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-label text-fg-tertiary mb-2">Analytics</p>
        <h1 className="text-display-lg">Student History</h1>
      </header>

      {/* Student Selector */}
      <div className="relative group max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fg-tertiary group-focus-within:text-accent-glow" />
        <input 
          type="text" 
          placeholder="Search student by name or USN..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface border border-border-subtle rounded-xl pl-12 pr-4 py-4 text-fg-primary focus:outline-none focus:border-accent-glow focus:ring-4 focus:ring-accent-glow/5"
        />
        
        {search && filteredStudents.length > 0 && !selectedStudent && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface-raised border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
            {filteredStudents.map(s => (
              <button 
                key={s.id}
                onClick={() => { fetchStudentHistory(s); setSearch(''); }}
                className="w-full px-6 py-3 text-left hover:bg-surface transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-body font-semibold text-fg-primary">{s.name}</p>
                  <p className="text-micro text-fg-tertiary">{s.usn}</p>
                </div>
                <span className="text-micro bg-surface px-2 py-1 rounded border border-border-subtle uppercase">{s.branch_code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedStudent ? (
        <div className="grid grid-cols-12 gap-8">
          {/* Profile Card */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="glass-card p-8">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-glow to-violet-900 flex items-center justify-center text-display-sm mb-4 border-2 border-accent-glow/20 shadow-xl">
                  {selectedStudent.name.charAt(0)}
                </div>
                <h3 className="text-h2">{selectedStudent.name}</h3>
                <p className="text-body text-fg-secondary font-mono mt-1">{selectedStudent.usn}</p>
                <div className="flex gap-2 mt-4">
                  <span className="pill pill-info text-[10px]">{selectedStudent.branch_code}</span>
                  <span className="pill pill-info text-[10px]">{selectedStudent.batch}</span>
                </div>
              </div>

              <div className="pt-8 border-t border-border-subtle">
                <p className="text-label text-fg-tertiary mb-2">Overall Attendance</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-display-md ${getStatusColor(attendanceRate)}`}>
                    {attendanceRate}%
                  </span>
                  <span className="text-body-sm text-fg-tertiary">
                    ({attendance.filter(a => a.present).length} / {attendance.length} sessions)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-inset rounded-full mt-4 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${attendanceRate >= 75 ? 'bg-success' : attendanceRate >= 60 ? 'bg-warning' : 'bg-danger'}`}
                    style={{ width: `${attendanceRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 text-center">
                <p className="text-micro text-fg-tertiary mb-1">Current Streak</p>
                <p className="text-h3 font-mono">5</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-micro text-fg-tertiary mb-1">Total Present</p>
                <p className="text-h3 font-mono text-success">12</p>
              </div>
            </div>
          </div>

          {/* Detailed History */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Heatmap Placeholder */}
            <div className="glass-card p-8">
              <p className="text-label text-fg-tertiary mb-6">Attendance Activity</p>
              <div className="flex flex-wrap gap-2">
                {attendance.map((a, i) => (
                  <div 
                    key={i} 
                    title={`${a.sessions.date}: ${a.sessions.topic}`}
                    className={`w-10 h-10 rounded-md border flex items-center justify-center transition-all hover:scale-110
                      ${a.present 
                        ? 'bg-success-bg border-success-border text-success' 
                        : 'bg-danger-bg border-danger-border text-danger'}`}
                  >
                    {a.present ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Session Table */}
            <div className="glass-card overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Session Topic</th>
                    <th>Status</th>
                    <th className="text-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id}>
                      <td className="font-mono text-xs">{record.sessions.date}</td>
                      <td className="font-medium">{record.sessions.topic}</td>
                      <td>
                        <span className={`pill ${record.present ? 'pill-success' : 'pill-danger'}`}>
                          {record.present ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td className="text-right text-fg-secondary text-sm">{record.sessions.duration_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-20 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-surface-raised border border-border-subtle rounded-full flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-fg-tertiary" />
          </div>
          <h2 className="text-h2 mb-2">No Student Selected</h2>
          <p className="text-body text-fg-secondary max-w-sm">
            Search and select a student from the search bar above to view their detailed attendance history and performance metrics.
          </p>
        </div>
      )}
    </div>
  )
}

export default StudentHistory
