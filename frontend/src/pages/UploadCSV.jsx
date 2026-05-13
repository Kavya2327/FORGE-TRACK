import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Database,
  Trash2
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

const UploadCSV = () => {
  const [file, setFile] = useState(null)
  const [data, setData] = useState([])
  const [headers, setHeaders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const navigate = useNavigate()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFile(file)
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setHeaders(Object.keys(results.data[0] || {}))
          setData(results.data)
          setError(null)
        },
        error: (err) => {
          setError('Failed to parse CSV: ' + err.message)
        }
      })
    }
  }

  const handleImport = async () => {
    if (!data.length) return
    setLoading(true)
    setError(null)
    try {
      // Map data to database columns
      // Expected headers: name, usn, email, branch_code
      const studentsToInsert = data.map(row => ({
        name: row.name || row.Name,
        usn: row.usn || row.USN,
        email: row.email || row.Email,
        branch_code: row.branch_code || row.Branch || 'CSE',
        is_active: true
      }))

      const { error: insertError } = await supabase
        .from('students')
        .upsert(studentsToInsert, { onConflict: 'usn' })

      if (insertError) throw insertError

      setSuccess(`Successfully imported ${data.length} students!`)
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setError('Import failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setData([])
    setHeaders([])
    setSuccess(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header>
        <p className="text-label text-fg-tertiary mb-2">Data Management</p>
        <h1 className="text-display-lg">Bulk Data Import</h1>
        <p className="text-body text-fg-secondary mt-2">
          Upload a CSV file to bulk import students into the system.
        </p>
      </header>

      {!file ? (
        <Card className="border-2 border-dashed border-border-default bg-surface/50 hover:bg-surface-raised/50 hover:border-accent-glow/40 transition-all cursor-pointer group relative">
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <CardContent className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 bg-accent-glow/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-accent-glow" />
            </div>
            <div className="text-center">
              <p className="text-h3 text-fg-primary">Click or drag to upload CSV</p>
              <p className="text-body-sm text-fg-tertiary mt-1">Expected columns: Name, USN, Email, Branch</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <Card className="bg-surface border-border-subtle">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-bg text-success rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-h3">{file.name}</CardTitle>
                  <CardDescription>{data.length} rows detected</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile} className="text-fg-tertiary hover:text-danger hover:bg-danger-bg/20">
                <Trash2 className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader className="bg-surface-raised sticky top-0 z-10">
                    <TableRow className="border-border-subtle">
                      {headers.map(h => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 5).map((row, i) => (
                      <TableRow key={i} className="border-border-subtle">
                        {headers.map(h => (
                          <TableCell key={h} className="text-fg-secondary text-xs">{row[h]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {data.length > 5 && (
                  <div className="p-4 text-center text-micro text-fg-tertiary bg-surface-raised/30">
                    Showing first 5 rows of {data.length}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-danger-bg border border-danger-border text-danger rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-success-bg border border-success-border text-success rounded-xl">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={clearFile} disabled={loading}>Cancel</Button>
            <Button 
              onClick={handleImport} 
              disabled={loading || !!success}
              className="bg-fg-primary text-void hover:bg-fg-primary/90 font-bold px-8 h-11"
            >
              {loading ? 'Importing...' : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Confirm Import
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Guide */}
      <Card className="bg-surface-raised/30 border-border-subtle">
        <CardContent className="p-6">
          <h4 className="text-label text-fg-primary mb-4">Import Guidelines</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-bold text-fg-secondary uppercase tracking-wider">Required Headers</p>
              <ul className="text-body-sm text-fg-tertiary space-y-1">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-success" /> Name</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-success" /> USN (Primary Key)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-success" /> Email</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-fg-secondary uppercase tracking-wider">Instructions</p>
              <p className="text-body-sm text-fg-tertiary leading-relaxed">
                Ensure your CSV is UTF-8 encoded. Duplicate USNs will be updated with the new data from the CSV file.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UploadCSV
