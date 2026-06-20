import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, FileText, Save, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
  id: number;
  boardId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesViewProps {
  boardId: number;
}

export function NotesView({ boardId }: NotesViewProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/planning/boards/${boardId}/notes`);
      const data = await res.json();
      setNotes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, [boardId]);

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsDirty(false);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/planning/notes/${selectedNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      const updated = await res.json();
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      setSelectedNote(updated);
      setIsDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/planning/boards/${boardId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), content: '' }),
      });
      const note = await res.json();
      setNotes(prev => [...prev, note]);
      setNewTitle('');
      setCreating(false);
      selectNote(note);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/planning/notes/${id}`, { method: 'DELETE' });
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setEditTitle('');
      setEditContent('');
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 h-96">
        <div className="w-64 space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
        <Skeleton className="flex-1 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex gap-4" style={{ minHeight: '480px' }}>
      {/* Left panel — note list */}
      <div className="w-64 flex flex-col gap-2 flex-shrink-0">
        <Button
          size="sm"
          className="w-full gap-1.5 justify-start"
          onClick={() => { setCreating(true); setSelectedNote(null); setNewTitle(''); }}
        >
          <Plus className="w-4 h-4" />
          {t('planning.newNote')}
        </Button>

        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-1.5"
            >
              <Input
                autoFocus
                placeholder={t('planning.noteTitlePlaceholder')}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') setCreating(false);
                }}
                className="h-8 text-sm"
              />
              <div className="flex gap-1">
                <Button size="sm" className="h-7 flex-1 text-xs" onClick={handleCreate} disabled={saving || !newTitle.trim()}>
                  {t('common.create')}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCreating(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-1 overflow-y-auto flex-1">
          {notes.length === 0 && !creating ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              {t('planning.noNotesTitle')}
            </div>
          ) : notes.map(note => (
            <motion.button
              key={note.id}
              onClick={() => selectNote(note)}
              className={`group w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
                selectedNote?.id === note.id
                  ? 'bg-primary/10 border-primary/30 text-foreground'
                  : 'border-border/40 hover:border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="truncate flex-1 min-w-0">
                  <div className="font-medium truncate">{note.title}</div>
                  {note.content && (
                    <div className="text-xs opacity-60 truncate mt-0.5">{note.content.slice(0, 50)}</div>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(note.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5 rounded flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Right panel — editor */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {selectedNote ? (
          <>
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={e => { setEditTitle(e.target.value); setIsDirty(true); }}
                className="font-semibold text-base border-0 border-b border-border/40 rounded-none px-0 h-9 focus-visible:ring-0 focus-visible:border-primary/50 bg-transparent"
                placeholder={t('planning.noteTitlePlaceholder')}
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="gap-1.5 flex-shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? t('common.loading') : t('common.save')}
              </Button>
            </div>
            <Textarea
              value={editContent}
              onChange={e => { setEditContent(e.target.value); setIsDirty(true); }}
              placeholder={t('planning.noteContentPlaceholder')}
              className="flex-1 resize-none text-sm min-h-80 border-border/40 bg-muted/10 focus-visible:border-primary/50"
            />
            <div className="text-xs text-muted-foreground/50 text-right">
              {t('planning.noteUpdated')} {new Date(selectedNote.updatedAt).toLocaleString()}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
              <Pencil className="w-7 h-7 opacity-40" />
            </div>
            <p className="text-sm">{t('planning.noNoteSelected')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
