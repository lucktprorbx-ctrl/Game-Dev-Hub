import { useListUsers, useUpdateUser, useCreateUser, useDeleteUser, getListUsersQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/ui/page-transition';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Shield, Users2, UserPlus, Trash2, AlertCircle, CheckCircle2, Ban } from 'lucide-react';
import { getSubroleClasses } from '@/lib/role-colors';
import { motion, AnimatePresence } from 'framer-motion';

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') {
    return (
      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 gap-1">
        <Shield className="w-3 h-3" />
        Admin
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 gap-1">
      <Users2 className="w-3 h-3" />
      Collaborateur
    </Badge>
  );
}

function SubroleBadge({ subrole }: { subrole: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSubroleClasses(subrole)}`}>
      {subrole}
    </span>
  );
}

const SUBROLE_OPTIONS = ['Scripter', 'UI Maker', 'Builder', 'Modeler', 'Animator', 'Sound Designer', 'Game Designer', 'Investor'];
const GROUP_OPTIONS = ['Core Team', 'Dev Team', 'Art Team', 'Marketing Team', 'Investors'];

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 260, damping: 22, delay: i * 0.05 },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

export default function Users() {
  const { data: users, isLoading } = useListUsers();
  const updateUser = useUpdateUser();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [role, setRole] = useState<'admin' | 'collaborator'>('collaborator');
  const [subroles, setSubroles] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [customSubrole, setCustomSubrole] = useState('');
  const [customGroup, setCustomGroup] = useState('');

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRobloxId, setNewRobloxId] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'collaborator'>('collaborator');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  type RobloxPreview = { robloxId: string; username: string; displayName: string | null; avatarUrl: string | null; isBanned: boolean };
  const [preview, setPreview] = useState<RobloxPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    const id = newRobloxId.trim();
    if (!id || id.length < 4) { setPreview(null); setPreviewError(''); setPreviewLoading(false); return; }
    setPreviewLoading(true); setPreviewError(''); setPreview(null);
    previewTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/preview/${id}`);
        const data = await res.json();
        if (!res.ok) { setPreviewError(data.error ?? t('users.userNotFound')); setPreview(null); }
        else setPreview(data as RobloxPreview);
      } catch { setPreviewError(t('users.failedFetchProfile')); }
      finally { setPreviewLoading(false); }
    }, 600);
    return () => { if (previewTimerRef.current) clearTimeout(previewTimerRef.current); };
  }, [newRobloxId]);

  const resetAddDialog = () => {
    setNewRobloxId(''); setNewRole('collaborator'); setAddError('');
    setPreview(null); setPreviewError(''); setPreviewLoading(false);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });

  const openEdit = (user: { id: number; role: 'admin' | 'collaborator'; subroles: string[]; groups: string[] }) => {
    setSelectedUser(user.id);
    setRole(user.role);
    setSubroles(user.subroles ?? []);
    setGroups(user.groups ?? []);
    setCustomSubrole('');
    setCustomGroup('');
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    await updateUser.mutateAsync({ id: selectedUser, data: { role, subroles, groups } });
    invalidate();
    setSelectedUser(null);
  };

  const handleDelete = async (id: number) => {
    await deleteUser.mutateAsync({ id });
    invalidate();
  };

  const handleAddUser = async () => {
    const id = newRobloxId.trim();
    if (!id) return;
    setAddError(''); setAddLoading(true);
    try {
      await createUser.mutateAsync({ data: { robloxId: id, role: newRole } });
      invalidate();
      setAddDialogOpen(false);
      setNewRobloxId(''); setNewRole('collaborator');
    } catch (err: any) {
      setAddError(err?.response?.data?.error ?? err?.message ?? t('users.failedAddUser'));
    } finally { setAddLoading(false); }
  };

  const toggleSubrole = (sr: string) => setSubroles(prev => prev.includes(sr) ? prev.filter(x => x !== sr) : [...prev, sr]);
  const toggleGroup = (g: string) => setGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const addCustomSubrole = () => {
    const v = customSubrole.trim();
    if (v && !subroles.includes(v)) setSubroles(prev => [...prev, v]);
    setCustomSubrole('');
  };

  const addCustomGroup = () => {
    const v = customGroup.trim();
    if (v && !groups.includes(v)) setGroups(prev => [...prev, v]);
    setCustomGroup('');
  };

  const editingUser = users?.find(u => u.id === selectedUser);

  return (
    <PageTransition>
      <motion.div
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.users')}</h1>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={() => { setAddDialogOpen(true); setAddError(''); }} className="gap-2">
            <UserPlus className="w-4 h-4" /> {t('users.addUser')}
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 22 }}
      >
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.tableUser')}</TableHead>
                  <TableHead>{t('users.tableRole')}</TableHead>
                  <TableHead>{t('users.tableSubroles')}</TableHead>
                  <TableHead>{t('users.tableGroups')}</TableHead>
                  <TableHead className="text-right">{t('users.tableActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="space-y-1.5"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-7 w-14 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">{t('users.noUsersYet')}</TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence initial={false}>
                    {users?.map((user, i) => (
                      <motion.tr
                        key={user.id}
                        custom={i}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="group border-b border-border/50 last:border-0"
                        whileHover={{ backgroundColor: 'hsl(var(--muted)/0.3)' }}
                        transition={{ duration: 0.15 }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.12 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                              className="flex-shrink-0"
                            >
                              {user.robloxAvatarUrl ? (
                                <img src={user.robloxAvatarUrl} alt="" className="w-8 h-8 rounded-full bg-muted ring-1 ring-border/50" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                                  {user.robloxUsername.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </motion.div>
                            <div>
                              <div className="font-medium">{user.robloxDisplayName || user.robloxUsername}</div>
                              <div className="text-xs text-muted-foreground">@{user.robloxUsername}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {user.subroles?.length > 0
                              ? user.subroles.map(sr => <SubroleBadge key={sr} subrole={sr} />)
                              : <span className="text-xs text-muted-foreground/50">—</span>
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {user.groups?.map(g => (
                              <span key={g} className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-border/40">{g}</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(user as any)}>
                              {t('common.edit')}
                            </Button>
                            <motion.button
                              whileHover={{ scale: 1.15, color: 'hsl(var(--destructive))' }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(user.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground p-1.5 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetAddDialog(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> {t('users.addTeamMember')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {t('users.robloxUserId')} <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground font-normal ml-1">{t('users.numericId')}</span>
              </label>
              <Input
                placeholder="e.g. 454458772"
                value={newRobloxId}
                onChange={e => setNewRobloxId(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                roblox.com/users/<strong>[ID]</strong>/profile
              </p>
            </div>

            <AnimatePresence>
              {newRobloxId.length >= 4 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-border/60 overflow-hidden"
                >
                  {previewLoading && (
                    <div className="flex items-center gap-3 p-3 bg-muted/10">
                      <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  )}
                  {!previewLoading && preview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-3 bg-muted/10"
                    >
                      {preview.avatarUrl ? (
                        <img src={preview.avatarUrl} alt={preview.username} className="w-16 h-16 rounded-lg object-cover bg-muted flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
                          {preview.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{preview.displayName || preview.username}</div>
                        {preview.displayName && <div className="text-xs text-muted-foreground">@{preview.username}</div>}
                        <div className="text-xs text-muted-foreground/60 mt-0.5">ID: {preview.robloxId}</div>
                        {preview.isBanned ? (
                          <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                            <Ban className="w-3 h-3" /> {t('users.accountBanned')}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> {t('users.profileFound')}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                  {!previewLoading && previewError && (
                    <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{previewError}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('users.role')}</label>
              <Select value={newRole} onValueChange={(v: 'admin' | 'collaborator') => setNewRole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-red-400" /> {t('users.adminLabel')}</span>
                  </SelectItem>
                  <SelectItem value="collaborator">
                    <span className="flex items-center gap-2"><Users2 className="w-3.5 h-3.5 text-blue-400" /> {t('users.collaboratorLabel')}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {addError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{addError}
              </div>
            )}
            <Button className="w-full" onClick={handleAddUser} disabled={addLoading || !newRobloxId.trim() || previewLoading}>
              {addLoading ? t('users.adding') : t('users.addUser')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={selectedUser !== null} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('users.editTitle')} {editingUser?.robloxDisplayName || editingUser?.robloxUsername}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('users.role')}</label>
              <Select value={role} onValueChange={(v: 'admin' | 'collaborator') => setRole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-red-400" /> {t('users.adminLabel')}</span>
                  </SelectItem>
                  <SelectItem value="collaborator">
                    <span className="flex items-center gap-2"><Users2 className="w-3.5 h-3.5 text-blue-400" /> {t('users.collaboratorLabel')}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('users.subroles')}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {SUBROLE_OPTIONS.map(sr => (
                  <motion.button
                    key={sr}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSubrole(sr)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      subroles.includes(sr)
                        ? getSubroleClasses(sr)
                        : 'border-border/60 text-muted-foreground hover:border-primary/30'
                    }`}>
                    {sr}
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder={t('users.customSubrole')} value={customSubrole} onChange={e => setCustomSubrole(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSubrole())} className="h-8 text-sm" />
                <Button size="sm" variant="outline" onClick={addCustomSubrole} className="h-8">{t('common.add')}</Button>
              </div>
              {subroles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {subroles.map(sr => (
                    <motion.button
                      key={sr}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleSubrole(sr)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-opacity hover:opacity-70 ${getSubroleClasses(sr)}`}>
                      {sr} ×
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('users.groups')}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {GROUP_OPTIONS.map(g => (
                  <motion.button
                    key={g}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleGroup(g)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${groups.includes(g) ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'border-border/60 text-muted-foreground hover:border-blue-500/30'}`}>
                    {g}
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder={t('users.customGroup')} value={customGroup} onChange={e => setCustomGroup(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomGroup())} className="h-8 text-sm" />
                <Button size="sm" variant="outline" onClick={addCustomGroup} className="h-8">{t('common.add')}</Button>
              </div>
              {groups.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {groups.map(g => (
                    <motion.span
                      key={g}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleGroup(g)}
                      className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 cursor-pointer hover:border-red-400/50 hover:text-red-400">
                      {g} ×
                    </motion.span>
                  ))}
                </div>
              )}
            </div>

            <Button className="w-full" onClick={handleUpdate} disabled={updateUser.isPending}>
              {updateUser.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
