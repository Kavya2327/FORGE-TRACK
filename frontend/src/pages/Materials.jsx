import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Plus, Search, FileText, ExternalLink,
  MoreVertical, BookOpen, Loader2
} from 'lucide-react'
import { FaYoutube } from 'react-icons/fa'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const Materials = () => {
  const [materials, setMaterials] = useState([])
  const [sessions, setSessions] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [newMaterial, setNewMaterial] = useState({
    session_id: '', title: '', type: 'slides', url: '', description: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: mData } = await supabase.from('materials').select('*, sessions(*)').order('created_at', { ascending: false })
    const { data: sData } = await supabase.from('sessions').select('*').order('date', { ascending: false })
    setMaterials(mData || [])
    setSessions(sData || [])
    setLoading(false)
  }

  const handleAddMaterial = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('materials').insert([newMaterial])
      if (error) throw error
      setOpen(false)
      fetchData()
      setNewMaterial({ session_id: '', title: '', type: 'slides', url: '', description: '' })
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'recording': return FaYoutube
      case 'slides': return FileText
      case 'document': return BookOpen
      default: return ExternalLink
    }
  }

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.sessions?.topic.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-label text-fg-tertiary mb-2">Resource Library</p>
          <h1 className="text-display-lg">Class Materials</h1>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-fg-primary text-void hover:bg-fg-primary/90 font-bold gap-2">
              <Plus className="w-5 h-5" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-surface border-border-subtle text-fg-primary max-w-md">
            <DialogHeader>
              <DialogTitle className="text-h3">Add New Material</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMaterial} className="space-y-5 py-4">
              <div className="space-y-2">
                <label className="text-label text-fg-tertiary">Related Session</label>
                <Select
                  value={newMaterial.session_id}
                  onValueChange={(val) => setNewMaterial({ ...newMaterial, session_id: val })}
                  required
                >
                  <SelectTrigger className="bg-surface-inset border-border-subtle">
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border-border-subtle text-fg-primary">
                    {sessions.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.date} - {s.topic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-label text-fg-tertiary">Title</label>
                <Input
                  required
                  placeholder="e.g. Session Slides"
                  value={newMaterial.title}
                  onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  className="bg-surface-inset border-border-subtle"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-label text-fg-tertiary">Type</label>
                  <Select
                    value={newMaterial.type}
                    onValueChange={(val) => setNewMaterial({ ...newMaterial, type: val })}
                  >
                    <SelectTrigger className="bg-surface-inset border-border-subtle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-border-subtle text-fg-primary">
                      <SelectItem value="slides">Slides</SelectItem>
                      <SelectItem value="recording">Recording</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="link">Other Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-label text-fg-tertiary">URL</label>
                  <Input
                    required
                    type="url"
                    placeholder="https://..."
                    value={newMaterial.url}
                    onChange={e => setNewMaterial({ ...newMaterial, url: e.target.value })}
                    className="bg-surface-inset border-border-subtle"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label text-fg-tertiary">Description (Optional)</label>
                <Input
                  placeholder="Brief summary..."
                  value={newMaterial.description}
                  onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  className="bg-surface-inset border-border-subtle"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={saving} className="w-full bg-accent-glow hover:bg-accent-glow/90 font-bold">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Material
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex gap-4">
        <div className="relative group flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary group-focus-within:text-accent-glow" />
          <Input
            placeholder="Search materials or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-surface-inset border-border-subtle"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => {
          const Icon = getIcon(material.type)
          return (
            <Card key={material.id} className="bg-surface border-border-subtle flex flex-col group hover:border-accent-glow/30 transition-all overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between pb-4">
                <div className="p-3 rounded-xl bg-surface-raised border border-border-subtle group-hover:bg-accent-glow/5 group-hover:border-accent-glow/20 transition-all">
                  <Icon className="w-6 h-6 text-accent-glow" />
                </div>
                <Button variant="ghost" size="icon" className="text-fg-tertiary hover:text-fg-primary">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </CardHeader>

              <CardContent className="flex-1">
                <p className="text-micro text-fg-tertiary mb-1 uppercase font-bold tracking-wider">
                  {material.sessions?.date}
                </p>
                <CardTitle className="text-h3 mb-2 line-clamp-1">{material.title}</CardTitle>
                <p className="text-body-sm text-fg-secondary line-clamp-2">
                  {material.description || `Learning resources for ${material.sessions?.topic}.`}
                </p>
              </CardContent>

              <CardFooter className="pt-6 border-t border-border-subtle flex justify-between items-center bg-surface-raised/30">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-raised rounded text-fg-tertiary border border-border-subtle uppercase">
                  {material.type}
                </span>
                <Button variant="link" className="text-accent-glow p-0 h-auto font-bold gap-2" asChild>
                  <a href={material.url} target="_blank" rel="noopener noreferrer">
                    View Resource <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          )
        })}

        {filteredMaterials.length === 0 && !loading && (
          <div className="col-span-full py-20 flex flex-col items-center text-center">
            <BookOpen className="w-12 h-12 text-fg-tertiary mb-4 opacity-20" />
            <h2 className="text-h2">No materials found</h2>
            <p className="text-body text-fg-secondary">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Materials