import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { 
  Check, 
  Calendar as CalendarIcon, 
  Info,
  Users,
  Search,
  Filter
} from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const MarkAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [session, setSession] = useState(null)
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const fetchSessionAndStudents = async () => {
    await Promise.resolve()
    setLoading(true)
    try {
      const { data: sessionData } = await supabase.from('sessions').select('*').eq('date', selectedDate).single()
      setSession(sessionData)
      const { data: studentsData } = await supabase.from('students').select('*').eq('is_active', true).order('name')
      setStudents(studentsData || [])

      if (sessionData) {
        const { data: attendanceData } = await supabase.from('attendance').select('*').eq('session_id', sessionData.id)
        const attendanceMap = {}
        attendanceData?.forEach(record => {
          attendanceMap[record.student_id] = record.present
        })
        setAttendance(attendanceMap)
      } else {
        setAttendance({})
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessionAndStudents()
  }, [selectedDate])



  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }))
  }

  const selectAll = (present) => {
    const newAttendance = {}
    students.forEach(s => { newAttendance[s.id] = present })
    setAttendance(newAttendance)
  }

  const handleCreateSession = async () => {
    try {
      const topic = window.prompt('Enter Session Topic:', 'New Session')
      if (!topic) return
      
      const { data, error } = await supabase.from('sessions').insert([{
        date: selectedDate,
        topic: topic,
        duration_hours: 2,
        session_type: 'Regular'
      }]).select().single()
      
      if (error) throw error
      setSession(data)
    } catch (err) {
      alert('Error creating session: ' + err.message)
    }
  }

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    try {
      const attendanceRows = students.map(s => ({
        student_id: s.id,
        session_id: session.id,
        present: !!attendance[s.id],
        marked_by: 'mentor'
      }))
      const { error } = await supabase.from('attendance').upsert(attendanceRows, { onConflict: 'student_id,session_id' })
      if (error) throw error
      
      alert('Attendance saved successfully!')
      navigate('/dashboard')
    } catch (err) {
      alert('Error saving attendance: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.usn.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-label text-fg-tertiary mb-2">Attendance Entry</p>
          <h1 className="text-display-lg">Mark Attendance</h1>
        </div>
        
        <div className="flex items-center gap-3 bg-surface-raised p-1 rounded-xl border border-border-subtle">
          <CalendarIcon className="w-4 h-4 text-accent-glow ml-3" />
          <Input 
            type="date" 
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none text-fg-primary focus-visible:ring-0 font-mono text-sm h-9"
          />
        </div>
      </header>

      {/* Session Info */}
      <Card className={`bg-surface border-l-4 ${session ? 'border-l-success border-border-subtle' : 'border-l-warning border-border-subtle'}`}>
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${session ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-h3">{session ? session.topic : 'No Session Scheduled'}</h3>
              <p className="text-body-sm text-fg-secondary">
                {session ? `${session.duration_hours}h • ${session.session_type} session` : 'Create a session for this date first.'}
              </p>
            </div>
          </div>
          {session ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => selectAll(true)} className="text-xs h-8">Select All</Button>
              <Button variant="outline" size="sm" onClick={() => selectAll(false)} className="text-xs h-8 hover:text-danger">Clear All</Button>
            </div>
          ) : (
            <Button onClick={handleCreateSession} className="bg-accent-glow text-white h-9">
              Create Session
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-4">
        <div className="relative group flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary group-focus-within:text-accent-glow" />
          <Input 
            placeholder="Search students..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-surface-inset border-border-subtle"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-surface border-border-subtle overflow-hidden">
        <Table>
          <TableHeader className="bg-surface-raised/50">
            <TableRow className="border-border-subtle hover:bg-transparent">
              <TableHead className="w-20 text-center">Status</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>USN</TableHead>
              <TableHead className="text-right">Department</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow 
                key={student.id} 
                className="border-border-subtle cursor-pointer hover:bg-surface-raised/50 transition-colors"
                onClick={() => toggleAttendance(student.id)}
              >
                <TableCell className="flex justify-center">
                  <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center
                    ${attendance[student.id] 
                      ? 'bg-success border-success text-void shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                      : 'bg-surface-inset border-border-strong text-transparent'}
                  `}>
                    <Check className="w-3 h-3 stroke-[4px]" />
                  </div>
                </TableCell>
                <TableCell className="font-medium text-fg-primary">{student.name}</TableCell>
                <TableCell className="font-mono text-xs text-fg-secondary">{student.usn}</TableCell>
                <TableCell className="text-right">
                  <span className="px-2 py-0.5 bg-surface-raised rounded text-[10px] font-bold text-fg-tertiary">
                    {student.branch_code}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Save Bar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <div className="glass-card flex items-center gap-8 px-8 py-4 bg-surface-raised/95 border-accent-glow/20 shadow-2xl">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span className="text-sm font-semibold">{Object.values(attendance).filter(Boolean).length} Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-danger"></div>
              <span className="text-sm font-semibold">{students.length - Object.values(attendance).filter(Boolean).length} Absent</span>
            </div>
          </div>
          <div className="w-px h-6 bg-border-subtle"></div>
          <Button 
            disabled={saving || !session}
            onClick={handleSave}
            className="bg-fg-primary text-void hover:bg-fg-primary/90 font-bold px-10 h-10"
          >
            {saving ? 'Saving...' : 'Confirm & Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MarkAttendance
