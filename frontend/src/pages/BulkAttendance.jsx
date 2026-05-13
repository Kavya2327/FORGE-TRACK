import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { analyzeSpreadsheetData } from '../lib/ai-attendance-parser'
import * as xlsx from 'xlsx'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  BrainCircuit,
  Calendar as CalendarIcon,
  Trash2,
  ListPlus
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

const BulkAttendance = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Upload, 2: Select Sheet, 3: AI Analysis, 4: Resolve Dates/Preview, 5: Importing
  
  // File state
  const [file, setFile] = useState(null)
  const [workbook, setWorkbook] = useState(null)
  const [sheets, setSheets] = useState([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [sheetData, setSheetData] = useState([])
  
  // AI Mapping state
  const [aiMapping, setAiMapping] = useState(null)
  const [userContext, setUserContext] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [existingSessions, setExistingSessions] = useState([])

  useEffect(() => {
    const fetchExistingSessions = async () => {
      const { data } = await supabase.from('sessions').select('*').order('date', { ascending: false }).limit(20)
      if (data) setExistingSessions(data)
    }
    fetchExistingSessions()
  }, [])

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = evt.target.result
      const wb = xlsx.read(data, { type: 'binary' })
      setWorkbook(wb)
      setSheets(wb.SheetNames)
      if (wb.SheetNames.length === 1) {
        handleSheetSelection(wb.SheetNames[0], wb)
      } else {
        setStep(2)
      }
    }
    reader.readAsBinaryString(uploadedFile)
  }

  const handleSheetSelection = (sheetName, wb = workbook) => {
    setSelectedSheet(sheetName)
    const worksheet = wb.Sheets[sheetName]
    // Get array of arrays to preserve structure
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 })
    setSheetData(jsonData)
    setStep(3)
  }

  const runAIAnalysis = async () => {
    if (!sheetData || sheetData.length === 0) return
    setAnalyzing(true)
    setAiError(null)
    
    try {
      // Find the first non-empty row to use as headers context
      const firstRowIndex = sheetData.findIndex(row => row.length > 0)
      if (firstRowIndex === -1) throw new Error("Spreadsheet is empty")
      
      // Pass the top 10 rows (including potential merged headers)
      const topRows = sheetData.slice(Math.max(0, firstRowIndex - 1), firstRowIndex + 10)
      
      const mapping = await analyzeSpreadsheetData(topRows, sheetData.slice(firstRowIndex + 2, firstRowIndex + 5), existingSessions, userContext)
      setAiMapping(mapping)
      setStep(4)
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDateUpdate = (index, value) => {
    const newMapping = { ...aiMapping }
    newMapping.attendanceColumns[index].inferredDate = value
    setAiMapping(newMapping)
  }

  const handleImport = async () => {
    setStep(5)
    setAiError(null)
    try {
      // Validate mapping
      if (!aiMapping.studentIdentifierColumn) throw new Error("Student Identifier column not mapped.")
      const missingDates = aiMapping.attendanceColumns.some(col => !col.inferredDate)
      if (missingDates) throw new Error("Please provide dates for all attendance columns.")

      // First, get all students to map identifier to student_id
      const { data: students, error: studentsError } = await supabase.from('students').select('id, usn, email')
      if (studentsError) throw studentsError

      // Process spreadsheet data
      const searchSpace = sheetData.slice(0, 5)
      
      let studentIdColIndex = -1

      // Locate columns
      for (let i = 0; i < searchSpace.length; i++) {
        for (let j = 0; j < searchSpace[i].length; j++) {
          const val = String(searchSpace[i][j]).trim()
          if (val === aiMapping.studentIdentifierColumn) {
            studentIdColIndex = j
          }
          aiMapping.attendanceColumns.forEach((col) => {
            if (val === col.header) {
              // Exact header match found
            }
          })
        }
      }

      // To handle multiple identical headers like "Attendance" reliably:
      // Let's just find ALL indices that match the AI's attendance column names in order
      const headerRow = searchSpace.find(row => row.includes(aiMapping.attendanceColumns[0]?.header) || row.includes(aiMapping.studentIdentifierColumn))
      if (!headerRow) throw new Error("Could not locate headers in the spreadsheet.")

      studentIdColIndex = headerRow.findIndex(val => String(val).trim() === aiMapping.studentIdentifierColumn)
      
      const foundIndices = new Set()
      aiMapping.attendanceColumns.forEach(col => {
        const idx = headerRow.findIndex((val, i) => String(val).trim() === col.header && !foundIndices.has(i))
        if (idx !== -1) {
          col.colIndex = idx
          foundIndices.add(idx)
        }
      })

      if (studentIdColIndex === -1) throw new Error("Could not find Student Identifier column in data.")

      // 1. Create or fetch Sessions
      const sessionsMap = {} // { "YYYY-MM-DD": session_id }
      for (const col of aiMapping.attendanceColumns) {
        if (!col.colIndex) continue
        const date = col.inferredDate
        let session = existingSessions.find(s => s.date === date && s.topic === col.topic)
        if (!session) {
          const { data, error } = await supabase.from('sessions').insert([{
            date: date,
            topic: col.topic || 'Imported Session',
            duration_hours: 2,
            session_type: 'Regular'
          }]).select().single()
          if (error) throw error
          session = data
        }
        sessionsMap[col.colIndex] = session.id
      }

      // 2. Prepare Attendance Records
      const attendanceRows = []
      // Skip top rows until we find the header row, then start from the next row
      const dataStartIndex = sheetData.findIndex(row => row === headerRow) + 1
      
      for (let i = dataStartIndex; i < sheetData.length; i++) {
        const row = sheetData[i]
        if (!row || row.length === 0) continue
        
        const identifierVal = String(row[studentIdColIndex] || '').trim().toLowerCase()
        if (!identifierVal) continue

        // Match student by USN or Email
        const student = students.find(s => 
          (s.usn && s.usn.toLowerCase() === identifierVal) || 
          (s.email && s.email.toLowerCase() === identifierVal)
        )
        
        if (!student) continue // Skip students not in DB

        for (const col of aiMapping.attendanceColumns) {
          if (!col.colIndex) continue
          const presentVal = String(row[col.colIndex] || '').toLowerCase()
          // Consider "true", "yes", "p", "1" as present
          const isPresent = ['true', 'yes', 'p', '1'].includes(presentVal) || presentVal === 'present'
          
          if (sessionsMap[col.colIndex]) {
            attendanceRows.push({
              student_id: student.id,
              session_id: sessionsMap[col.colIndex],
              present: isPresent,
              marked_by: 'bulk_upload'
            })
          }
        }
      }

      // 3. Upsert Attendance
      if (attendanceRows.length > 0) {
        // Chunk inserts to avoid payload too large
        const chunkSize = 500
        for (let i = 0; i < attendanceRows.length; i += chunkSize) {
          const chunk = attendanceRows.slice(i, i + chunkSize)
          const { error } = await supabase.from('attendance').upsert(chunk, { onConflict: 'student_id,session_id' })
          if (error) throw error
        }
      }

      alert(`Successfully imported ${attendanceRows.length} attendance records!`)
      navigate('/dashboard')
    } catch (err) {
      setAiError(err.message)
      setStep(4) // Go back to preview on error
    }
  }

  const reset = () => {
    setFile(null)
    setWorkbook(null)
    setSheets([])
    setSheetData([])
    setAiMapping(null)
    setStep(1)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header>
        <p className="text-label text-fg-tertiary mb-2">Data Management</p>
        <h1 className="text-display-lg">Bulk Attendance Import</h1>
        <p className="text-body text-fg-secondary mt-2">
          Upload spreadsheets, let AI detect columns, and map attendance directly to your database.
        </p>
      </header>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card className="border-2 border-dashed border-border-default bg-surface/50 hover:bg-surface-raised/50 transition-all cursor-pointer group relative">
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <CardContent className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 bg-accent-glow/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-accent-glow" />
            </div>
            <div className="text-center">
              <p className="text-h3 text-fg-primary">Click or drag to upload Excel/CSV</p>
              <p className="text-body-sm text-fg-tertiary mt-1">Supports multi-sheet workbooks (.xlsx, .csv)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Sheet */}
      {step === 2 && (
        <Card className="bg-surface border-border-subtle animate-in fade-in slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle className="text-h3">Select Sheet</CardTitle>
            <CardDescription>This workbook contains multiple sheets. Select which one to process.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sheets.map(sheet => (
              <Button 
                key={sheet} 
                variant="outline" 
                className="h-16 justify-start px-6 border-border-strong hover:border-accent-glow"
                onClick={() => handleSheetSelection(sheet)}
              >
                <FileSpreadsheet className="w-5 h-5 mr-3 text-fg-secondary" />
                {sheet}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: AI Analysis Trigger */}
      {step === 3 && (
        <Card className="bg-surface border-border-subtle animate-in fade-in slide-in-from-bottom-4 overflow-hidden relative">
          {analyzing && (
            <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <BrainCircuit className="w-10 h-10 text-accent-glow animate-pulse mb-4" />
              <h3 className="text-h3">AI is analyzing your data...</h3>
              <p className="text-sm text-fg-tertiary">Mapping columns and resolving dates</p>
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between border-b border-border-subtle pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-glow/10 text-accent-glow rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-h3">{file?.name}</CardTitle>
                <CardDescription>Sheet: {selectedSheet} ({sheetData.length} rows)</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={reset} className="text-fg-tertiary hover:text-danger hover:bg-danger-bg/20">
              <Trash2 className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="bg-surface-inset p-4 rounded-xl border border-border-subtle">
              <label className="text-sm font-semibold text-fg-secondary mb-2 block">Optional Context for AI</label>
              <Input 
                placeholder="e.g. 'Classes are on Mondays and Wednesdays starting Jan 1st'"
                value={userContext}
                onChange={e => setUserContext(e.target.value)}
                className="bg-surface border-border-strong"
              />
              <p className="text-xs text-fg-tertiary mt-2">Providing context helps the AI correctly infer dates for generic columns like 'Day 1'.</p>
            </div>
            
            {aiError && (
              <div className="flex items-center gap-3 p-4 bg-danger-bg border border-danger-border text-danger rounded-xl">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{aiError}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={runAIAnalysis} disabled={analyzing} className="bg-accent-glow text-white h-11 px-8 hover:bg-accent-glow/90 font-bold">
                <BrainCircuit className="w-4 h-4 mr-2" />
                {analyzing ? 'Analyzing...' : 'Analyze with AI'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4 & 5: AI Mapping Review & Import */}
      {step >= 4 && aiMapping && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <Card className="bg-surface border-border-subtle">
            <CardHeader className="border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-accent-glow" />
                <CardTitle className="text-h3">AI Data Mapping Review</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {aiError && (
                <div className="flex items-center gap-3 p-4 bg-danger-bg border border-danger-border text-danger rounded-xl">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{aiError}</p>
                </div>
              )}

              {aiMapping.needsDateInference && (
                <div className="bg-warning-bg/20 border border-warning/30 p-4 rounded-xl space-y-4">
                  <div className="flex items-start gap-3 text-warning">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Action Required: Missing Dates</h4>
                      <p className="text-sm text-warning/80 mt-1">{aiMapping.questionForUser}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-fg-secondary uppercase tracking-wider mb-4">Identifier</h4>
                  <div className="flex items-center gap-3 bg-surface-inset p-3 rounded-lg border border-border-subtle">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm text-fg-primary">Mapped column <span className="font-mono text-accent-glow bg-accent-glow/10 px-1 rounded">'{aiMapping.studentIdentifierColumn}'</span> to Student DB</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-fg-secondary uppercase tracking-wider mb-4">Attendance Sessions ({aiMapping.attendanceColumns.length})</h4>
                <div className="overflow-x-auto rounded-xl border border-border-subtle">
                  <Table>
                    <TableHeader className="bg-surface-raised">
                      <TableRow className="border-border-subtle">
                        <TableHead>Spreadsheet Column</TableHead>
                        <TableHead>Topic / Session Name</TableHead>
                        <TableHead>Session Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aiMapping.attendanceColumns.map((col, idx) => (
                        <TableRow key={idx} className="border-border-subtle">
                          <TableCell className="font-mono text-xs">{col.header}</TableCell>
                          <TableCell className="text-sm">{col.topic}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-fg-tertiary" />
                              <Input 
                                type="date"
                                value={col.inferredDate || ''}
                                onChange={(e) => handleDateUpdate(idx, e.target.value)}
                                className={`h-8 w-40 text-sm ${!col.inferredDate ? 'border-warning focus-visible:ring-warning' : 'border-border-strong'}`}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
                <Button variant="ghost" onClick={() => setStep(3)} disabled={step === 5}>
                  Back
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={step === 5 || aiMapping.attendanceColumns.some(c => !c.inferredDate)}
                  className="bg-fg-primary text-void hover:bg-fg-primary/90 font-bold px-8 h-11"
                >
                  {step === 5 ? 'Importing...' : (
                    <>
                      <ListPlus className="w-4 h-4 mr-2" />
                      Confirm & Import
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default BulkAttendance
