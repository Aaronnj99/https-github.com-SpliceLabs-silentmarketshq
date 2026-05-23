'use client'
import { useState, useEffect, useRef } from 'react'
import { FileText, Search, X, Plus, FolderOpen, ExternalLink, Tag, ChevronRight } from 'lucide-react'
import { useObsidian } from '@/hooks/useObsidian'
import { useJarvisStore } from '@/store/jarvis'
import ReactMarkdown from 'react-markdown'
import type { ObsidianNote } from '@/store/jarvis'
import { format, parseISO } from 'date-fns'

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d')
  } catch {
    try {
      return format(new Date(dateStr), 'MMM d')
    } catch {
      return dateStr
    }
  }
}

function NoteModal({ note, onClose }: { note: ObsidianNote; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(8,10,15,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#0D1117',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '18px', color: '#E5E7EB' }}>
              {note.title}
            </h2>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
                {note.wordCount} words · Modified {formatDate(note.modified)}
              </span>
              {note.tags.slice(0, 4).map((tag) => (
                <span key={tag} style={{ fontSize: '10px', color: '#9945FF', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(153,69,255,0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px',
              lineHeight: '1.8',
              color: '#D1D5DB',
            }}
            className="markdown-content"
          >
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewNoteModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string, content: string) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title required'); return }
    setCreating(true)
    setError('')
    try {
      await onCreate(title.trim(), content.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(8,10,15,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#0D1117', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '12px', width: '100%', maxWidth: '560px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '16px', color: '#E5E7EB' }}>New Note</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            autoFocus
            style={{ width: '100%', background: '#111827', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '6px', color: '#E5E7EB', fontSize: '14px', fontFamily: 'JetBrains Mono, monospace', padding: '10px 12px', outline: 'none', marginBottom: '8px', boxSizing: 'border-box' }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            rows={8}
            style={{ width: '100%', background: '#111827', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '6px', color: '#E5E7EB', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', padding: '10px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '8px' }}
          />
          {error && <div style={{ color: '#FF4444', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#4B5563', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '8px 16px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={creating} style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.4)', borderRadius: '6px', color: '#00D4FF', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '8px 16px', cursor: 'pointer' }}>
              {creating ? 'Creating...' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ObsidianWidget() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedNote, setSelectedNote] = useState<ObsidianNote | null>(null)
  const [showNewNote, setShowNewNote] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setGlobalNote = useJarvisStore((s) => s.setSelectedNote)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])

  const { notes, configured, isLoading, error, createNote } = useObsidian(debouncedQuery || undefined)

  const displayNotes = notes.slice(0, 5)

  return (
    <>
      <div className="card" style={{ padding: '16px', minHeight: '280px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="#9945FF" />
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '14px', color: '#E5E7EB' }}>
              Obsidian
            </span>
            {configured && (
              <span style={{ fontSize: '10px', color: '#9945FF', fontFamily: 'JetBrains Mono, monospace' }}>
                {notes.length} notes
              </span>
            )}
          </div>
          {configured && (
            <button
              onClick={() => setShowNewNote(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(153,69,255,0.1)', border: '1px solid rgba(153,69,255,0.3)', borderRadius: '4px', color: '#9945FF', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', padding: '4px 8px', cursor: 'pointer' }}
            >
              <Plus size={12} />
              New
            </button>
          )}
        </div>

        {/* Not configured */}
        {!configured && !isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '32px 16px', textAlign: 'center' }}>
            <FolderOpen size={32} color="rgba(153,69,255,0.3)" />
            <div>
              <div style={{ color: '#E5E7EB', fontSize: '13px', fontFamily: 'Syne, sans-serif', fontWeight: 600, marginBottom: '4px' }}>
                Connect Obsidian Vault
              </div>
              <div style={{ color: '#4B5563', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
                Set OBSIDIAN_VAULT_PATH in .env.local
              </div>
            </div>
            <a href="/settings" style={{ background: 'rgba(153,69,255,0.15)', border: '1px solid rgba(153,69,255,0.4)', borderRadius: '6px', color: '#9945FF', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '8px 16px', textDecoration: 'none' }}>
              Configure
            </a>
          </div>
        )}

        {/* Search */}
        {configured && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(153,69,255,0.15)', borderRadius: '6px', padding: '0 10px', marginBottom: '10px' }}>
            <Search size={13} color="#4B5563" style={{ flexShrink: 0 }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E5E7EB', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '7px 0' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: '2px' }}>
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Notes list */}
        {configured && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton" style={{ height: '48px', borderRadius: '4px' }} />
              ))
            ) : error ? (
              <div style={{ color: '#FF4444', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '16px 0' }}>{error}</div>
            ) : displayNotes.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#4B5563', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '24px 0' }}>
                {searchQuery ? `No results for "${searchQuery}"` : 'No notes found in vault'}
              </div>
            ) : (
              displayNotes.map((note) => (
                <button
                  key={note.filename}
                  onClick={() => { setSelectedNote(note); setGlobalNote(note) }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s ease' }}
                >
                  <FileText size={14} color="#9945FF" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '12px', color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {note.title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                      {note.preview}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '3px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatDate(note.modified)}
                      </span>
                      {note.tags.slice(0, 3).map((tag) => (
                        <span key={tag} style={{ fontSize: '9px', color: '#9945FF', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(153,69,255,0.08)', padding: '1px 4px', borderRadius: '2px' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={12} color="#4B5563" style={{ flexShrink: 0, marginTop: '2px' }} />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Note Modal */}
      {selectedNote && (
        <NoteModal note={selectedNote} onClose={() => { setSelectedNote(null); setGlobalNote(null) }} />
      )}

      {/* New Note Modal */}
      {showNewNote && (
        <NewNoteModal onClose={() => setShowNewNote(false)} onCreate={createNote} />
      )}
    </>
  )
}
