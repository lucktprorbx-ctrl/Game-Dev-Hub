import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/ui/page-transition';
import {
  Wrench, Power, CheckCircle2, AlertCircle, Plus, Trash2, Edit2, X, Palette,
  Users2, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';

// ─── Types ───────────────────────────────────────────────────────────────────
type CustomSubrole = { id: string; name: string; color: string };
type UserGroup = { id: number; name: string; description: string | null; color: string; members: { id: number }[] };

// ─── Color palettes ───────────────────────────────────────────────────────────
const SUBROLE_COLORS = [
  '#8b5cf6', '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#a855f7',
  '#e11d48', '#0ea5e9',
];
const GROUP_COLORS = [
  '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6',
  '#10b981', '#ec4899', '#14b8a6', '#f97316',
];

// ─── Maintenance Panel ────────────────────────────────────────────────────────
function MaintenancePanel() {
  const { t } = useTranslation();
  const { data: status, refetch } = useMaintenanceMode();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status) { setEnabled(status.maintenanceMode); setMessage(status.message ?? ''); }
  }, [status]);

  const isDirty = status
    ? enabled !== status.maintenanceMode || (message.trim() || null) !== (status.message ?? null)
    : false;

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await fetch('/api/admin/maintenance', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceMode: enabled, message: message.trim() || null }),
        credentials: 'include',
      });
      await refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <Wrench className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">{t('maintenance.maintenanceSection')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('maintenance.maintenanceSectionDesc')}</p>
        </div>
      </div>

      <Card className={cn("border transition-colors", enabled ? "border-amber-500/30 bg-amber-500/5" : "border-border/50")}>
        <CardContent className="p-5 space-y-5">
          {/* Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Power className={cn("w-4 h-4", enabled ? "text-amber-400" : "text-muted-foreground")} />
                <span className="text-sm font-medium">{t('maintenance.toggle')}</span>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-semibold border",
                  enabled ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-muted/50 text-muted-foreground border-border/50"
                )}>
                  {enabled ? t('maintenance.enabled') : t('maintenance.disabled')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t('maintenance.toggleDesc')}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setEnabled(v => !v)}
              className={cn("relative w-12 h-6 rounded-full transition-colors flex-shrink-0", enabled ? "bg-amber-500" : "bg-muted")}
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                animate={{ x: enabled ? 26 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t('maintenance.messageLabel')}</label>
            <Input
              placeholder={t('maintenance.messagePlaceholder')}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="text-sm bg-muted/20"
            />
          </div>

          {/* Save */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground/50">
              {status?.updatedAt && `${t('maintenance.lastUpdated')}: ${new Date(status.updatedAt).toLocaleString()}`}
            </span>
            <Button size="sm" onClick={handleSave} disabled={saving || (!isDirty && !saved)}
              className={cn(saved && "bg-green-600 hover:bg-green-600")}>
              {saving ? t('maintenance.saving') : saved ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />{t('maintenance.saved')}</> : t('maintenance.save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">{t('maintenance.adminBanner')}</p>
              {message && <p className="text-xs text-muted-foreground mt-1">Message: "{message}"</p>}
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}

// ─── Subroles Panel ───────────────────────────────────────────────────────────
function SubrolesPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: subroles = [], isLoading } = useQuery<CustomSubrole[]>({
    queryKey: ['custom-subroles'],
    queryFn: () => fetch('/api/subroles', { credentials: 'include' }).then(r => r.json()),
  });

  const create = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      fetch('/api/subroles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-subroles'] }),
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; color: string }) =>
      fetch(`/api/subroles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-subroles'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => fetch(`/api/subroles/${id}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-subroles'] }),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<CustomSubrole | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBROLE_COLORS[0]!);

  const openEdit = (sr: CustomSubrole) => { setEditItem(sr); setName(sr.name); setColor(sr.color); };
  const closeEdit = () => { setEditItem(null); setName(''); setColor(SUBROLE_COLORS[0]!); };
  const closeAdd = () => { setAddOpen(false); setName(''); setColor(SUBROLE_COLORS[0]!); };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await create.mutateAsync({ name: name.trim(), color });
    closeAdd();
  };

  const handleUpdate = async () => {
    if (!editItem || !name.trim()) return;
    await update.mutateAsync({ id: editItem.id, name: name.trim(), color });
    closeEdit();
  };

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">{t('settings.subrolesSection')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('settings.subrolesSectionDesc')}</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 flex-shrink-0" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> {t('settings.addSubrole')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : subroles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border/40 rounded-xl text-center">
          <Layers className="w-8 h-8 mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t('settings.noSubroles')}</p>
          <Button size="sm" variant="ghost" className="mt-3 gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> {t('settings.addSubrole')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <AnimatePresence initial={false}>
            {subroles.map(sr => (
              <motion.div
                key={sr.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:border-border/70 transition-colors"
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sr.color }} />
                <span className="text-sm font-medium flex-1 truncate">{sr.name}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(sr)}
                    className="p-1.5 text-muted-foreground/40 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => remove.mutate(sr.id)}
                    className="p-1.5 text-muted-foreground/30 hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={open => { if (!open) closeAdd(); else setAddOpen(true); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" /> {t('settings.addSubrole')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('settings.subroleName')} <span className="text-destructive">*</span></label>
              <Input placeholder={t('settings.subroleNamePlaceholder')} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> {t('settings.subroleColor')}
              </label>
              <div className="flex flex-wrap gap-2">
                {SUBROLE_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeAdd}>{t('common.cancel')}</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={!name.trim() || create.isPending}>
                {create.isPending ? t('common.create') + '…' : t('common.create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => { if (!open) closeEdit(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-violet-400" /> {t('settings.editSubrole')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('settings.subroleName')}</label>
              <Input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdate()} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('settings.subroleColor')}</label>
              <div className="flex flex-wrap gap-2">
                {SUBROLE_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeEdit}>{t('common.cancel')}</Button>
              <Button className="flex-1" onClick={handleUpdate} disabled={!name.trim() || update.isPending}>
                {update.isPending ? t('common.save') + '…' : t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ─── Groups Panel ─────────────────────────────────────────────────────────────
function GroupsPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery<UserGroup[]>({
    queryKey: ['user-groups'],
    queryFn: () => fetch('/api/user-groups', { credentials: 'include' }).then(r => r.json()),
  });

  const create = useMutation({
    mutationFn: (data: { name: string; color: string; description?: string }) =>
      fetch('/api/user-groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-groups'] }),
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: { id: number; name: string; color: string; description?: string }) =>
      fetch(`/api/user-groups/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-groups'] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => fetch(`/api/user-groups/${id}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-groups'] }),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<UserGroup | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState(GROUP_COLORS[0]!);

  const openEdit = (g: UserGroup) => { setEditItem(g); setName(g.name); setDesc(g.description ?? ''); setColor(g.color); };
  const closeEdit = () => { setEditItem(null); setName(''); setDesc(''); setColor(GROUP_COLORS[0]!); };
  const closeAdd = () => { setAddOpen(false); setName(''); setDesc(''); setColor(GROUP_COLORS[0]!); };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await create.mutateAsync({ name: name.trim(), color, description: desc.trim() || undefined });
    closeAdd();
  };

  const handleUpdate = async () => {
    if (!editItem || !name.trim()) return;
    await update.mutateAsync({ id: editItem.id, name: name.trim(), color, description: desc.trim() || undefined });
    closeEdit();
  };

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <Users2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">{t('settings.groupsSection')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('settings.groupsSectionDesc')}</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 flex-shrink-0" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> {t('settings.addGroup')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border/40 rounded-xl text-center">
          <Users2 className="w-8 h-8 mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t('settings.noGroups')}</p>
          <Button size="sm" variant="ghost" className="mt-3 gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> {t('settings.addGroup')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <AnimatePresence initial={false}>
            {groups.map(g => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:border-border/70 transition-colors"
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{g.name}</p>
                  <p className="text-[10px] text-muted-foreground">{g.members.length} {t('users.membersOf').toLowerCase()}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(g)} className="p-1.5 text-muted-foreground/40 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => remove.mutate(g.id)} className="p-1.5 text-muted-foreground/30 hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={open => { if (!open) closeAdd(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users2 className="w-4 h-4 text-blue-400" /> {t('settings.addGroup')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('settings.groupName')} <span className="text-destructive">*</span></label>
              <Input placeholder={t('settings.groupNamePlaceholder')} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('users.descriptionLabel')} <span className="text-xs text-muted-foreground font-normal">{t('common.optional')}</span></label>
              <Input placeholder={t('users.descriptionPlaceholder')} value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('users.color')}</label>
              <div className="flex flex-wrap gap-2">
                {GROUP_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeAdd}>{t('common.cancel')}</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={!name.trim() || create.isPending}>
                {create.isPending ? t('common.create') + '…' : t('common.create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => { if (!open) closeEdit(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-400" /> {t('settings.editGroup')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('settings.groupName')}</label>
              <Input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdate()} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('users.descriptionLabel')}</label>
              <Input placeholder={t('users.descriptionPlaceholder')} value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('users.color')}</label>
              <div className="flex flex-wrap gap-2">
                {GROUP_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeEdit}>{t('common.cancel')}</Button>
              <Button className="flex-1" onClick={handleUpdate} disabled={!name.trim() || update.isPending}>
                {update.isPending ? t('common.save') + '…' : t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export default function Settings() {
  const { t } = useTranslation();

  return (
    <PageTransition>
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('nav.settings')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('settings.subtitle')}</p>
        </div>
      </motion.div>

      <div className="space-y-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 200, damping: 22 }}
        >
          <MaintenancePanel />
        </motion.div>

        <div className="h-px bg-border/40" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 22 }}
        >
          <SubrolesPanel />
        </motion.div>

        <div className="h-px bg-border/40" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 22 }}
        >
          <GroupsPanel />
        </motion.div>
      </div>
    </PageTransition>
  );
}
