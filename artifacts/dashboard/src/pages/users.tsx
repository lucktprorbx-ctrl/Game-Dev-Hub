import {
  useListUsers, useUpdateUser, useCreateUser, useDeleteUser, getListUsersQueryKey,
  useListTeams, useCreateTeam, useDeleteTeam, useAddTeamMember, useRemoveTeamMember, getListTeamsQueryKey,
} from '@workspace/api-client-react';
import type { Team } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/ui/page-transition';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Shield, Users2, UserPlus, Trash2, AlertCircle, CheckCircle2, Ban, Plus, X, Palette } from 'lucide-react';
import { getSubroleClasses } from '@/lib/role-colors';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

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

const TEAM_COLORS = [
  '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6',
  '#10b981', '#ec4899', '#14b8a6', '#f97316',
];

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22, delay: i * 0.05 },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

// ── Teams Management Component ────────────────────────────────────────────────

function TeamsManagement() {
  const { data: teams, isLoading } = useListTeams();
  const { data: users } = useListUsers();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const queryClient = useQueryClient();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState(TEAM_COLORS[0]);
  const [newTeamDesc, setNewTeamDesc] = useState('');

  const [addMemberTeam, setAddMemberTeam] = useState<Team | null>(null);
  const [addMemberUserId, setAddMemberUserId] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    await createTeam.mutateAsync({ data: { name: newTeamName.trim(), color: newTeamColor, description: newTeamDesc.trim() || undefined } });
    invalidate();
    setCreateDialogOpen(false);
    setNewTeamName('');
    setNewTeamDesc('');
    setNewTeamColor(TEAM_COLORS[0]);
  };

  const handleDeleteTeam = async (id: number) => {
    await deleteTeam.mutateAsync({ id });
    invalidate();
  };

  const handleAddMember = async () => {
    if (!addMemberTeam || !addMemberUserId) return;
    await addMember.mutateAsync({ id: addMemberTeam.id, data: { userId: Number(addMemberUserId) } });
    invalidate();
    setAddMemberUserId('');
  };

  const handleRemoveMember = async (teamId: number, userId: number) => {
    await removeMember.mutateAsync({ id: teamId, userId });
    invalidate();
  };

  const teamList = Array.isArray(teams) ? teams : [];
  const userList = Array.isArray(users) ? users : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Teams control which planning boards are visible to which collaborators.</p>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" /> New Team
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : teamList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/50 rounded-xl">
          <Users2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium mb-1">No teams yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create a team to control board visibility</p>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}><Plus className="w-4 h-4 mr-1.5" />New Team</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamList.map(team => {
            const memberIds = new Set(team.members.map(m => m.userId));
            const eligible = userList.filter(u => !memberIds.has(u.id));

            return (
              <Card key={team.id} className="border border-border/50">
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                      <CardTitle className="text-base">{team.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">{team.members.length} members</Badge>
                    </div>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-muted-foreground/50 hover:text-destructive transition-colors p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {team.description && (
                    <p className="text-xs text-muted-foreground mt-1">{team.description}</p>
                  )}
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {team.members.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {team.members.map(m => (
                        <div key={m.userId} className="flex items-center gap-1 bg-muted/40 border border-border/50 rounded-full pl-2 pr-1 py-0.5">
                          <span className="text-xs font-medium">{m.displayName || m.username}</span>
                          <button
                            onClick={() => handleRemoveMember(team.id, m.userId)}
                            className="text-muted-foreground/50 hover:text-destructive transition-colors p-0.5 rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 italic">No members yet</p>
                  )}

                  {eligible.length > 0 && (
                    <div className="flex gap-2">
                      <Select value={addMemberTeam?.id === team.id ? addMemberUserId : ''} onValueChange={v => { setAddMemberTeam(team); setAddMemberUserId(v); }}>
                        <SelectTrigger className="h-7 text-xs flex-1">
                          <SelectValue placeholder="Add member…" />
                        </SelectTrigger>
                        <SelectContent>
                          {eligible.map(u => (
                            <SelectItem key={u.id} value={String(u.id)} className="text-xs">
                              {u.robloxDisplayName || u.robloxUsername}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={addMemberTeam?.id !== team.id || !addMemberUserId}
                        onClick={handleAddMember}
                      >
                        <UserPlus className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={(o) => { setCreateDialogOpen(o); if (!o) { setNewTeamName(''); setNewTeamDesc(''); setNewTeamColor(TEAM_COLORS[0]); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users2 className="w-4 h-4" /> New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Team Name <span className="text-destructive">*</span></label>
              <Input placeholder="e.g. Dev Team" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateTeam()} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Input placeholder="Optional short description" value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1.5"><Palette className="w-3.5 h-3.5 text-muted-foreground" /> Color</label>
              <div className="flex flex-wrap gap-2">
                {TEAM_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewTeamColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${newTeamColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleCreateTeam} disabled={createTeam.isPending || !newTeamName.trim()}>
              {createTeam.isPending ? 'Creating…' : 'Create Team'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Groups Management Component ───────────────────────────────────────────────

const GROUP_COLORS = [
  '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6',
  '#10b981', '#ec4899', '#14b8a6', '#f97316',
];

type UserGroupMember = { id: number; username: string; displayName: string | null; avatarUrl: string | null };
type UserGroup = { id: number; name: string; description: string | null; color: string; members: UserGroupMember[] };

function GroupsManagement() {
  const queryClient = useQueryClient();
  const { data: users } = useListUsers();

  const { data: groups, isLoading } = useQuery<UserGroup[]>({
    queryKey: ['user-groups'],
    queryFn: () => fetch('/api/user-groups').then(r => r.json()),
  });

  const createGroup = useMutation({
    mutationFn: (data: { name: string; color: string; description?: string }) =>
      fetch('/api/user-groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-groups'] }),
  });

  const deleteGroup = useMutation({
    mutationFn: (id: number) => fetch(`/api/user-groups/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-groups'] }),
  });

  const addMember = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
      fetch(`/api/user-groups/${groupId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-groups'] }),
  });

  const removeMember = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
      fetch(`/api/user-groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-groups'] }),
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0]);
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [addMemberGroupId, setAddMemberGroupId] = useState<number | null>(null);
  const [addMemberUserId, setAddMemberUserId] = useState('');

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    await createGroup.mutateAsync({ name: newGroupName.trim(), color: newGroupColor, description: newGroupDesc.trim() || undefined });
    setCreateDialogOpen(false);
    setNewGroupName(''); setNewGroupDesc(''); setNewGroupColor(GROUP_COLORS[0]);
  };

  const handleAddMember = async () => {
    if (!addMemberGroupId || !addMemberUserId) return;
    await addMember.mutateAsync({ groupId: addMemberGroupId, userId: Number(addMemberUserId) });
    setAddMemberUserId('');
  };

  const groupList = Array.isArray(groups) ? groups : [];
  const userList = Array.isArray(users) ? users : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Groups let you organise members independently of planning teams.</p>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" /> New Group
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : groupList.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No groups yet. Create one to get started.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {groupList.map(group => (
            <Card key={group.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                    <div>
                      <div className="font-medium text-sm">{group.name}</div>
                      {group.description && <div className="text-xs text-muted-foreground">{group.description}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => setAddMemberGroupId(group.id)}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteGroup.mutate(group.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Add member row */}
                {addMemberGroupId === group.id && (
                  <div className="mt-3 flex gap-2 border-t border-border/40 pt-3">
                    <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Select a user…" />
                      </SelectTrigger>
                      <SelectContent>
                        {userList
                          .filter(u => !group.members.some(m => m.id === u.id))
                          .map(u => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.robloxDisplayName || u.robloxUsername}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8 text-xs" onClick={handleAddMember} disabled={!addMemberUserId}>Add</Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setAddMemberGroupId(null); setAddMemberUserId(''); }}>Cancel</Button>
                  </div>
                )}

                {/* Members */}
                {group.members.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {group.members.map(m => (
                      <div key={m.id} className="flex items-center gap-1 bg-muted/40 rounded-full pl-0.5 pr-2 py-0.5">
                        {m.avatarUrl
                          ? <img src={m.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                          : <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">{m.username.charAt(0)}</div>
                        }
                        <span className="text-xs">{m.displayName || m.username}</span>
                        <button
                          onClick={() => removeMember.mutate({ groupId: group.id, userId: m.id })}
                          className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create group dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Group</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name *</label>
              <Input placeholder="e.g. Art Team" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateGroup()} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Input placeholder="Optional…" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 block">
                <Palette className="w-3.5 h-3.5 text-muted-foreground" /> Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {GROUP_COLORS.map(c => (
                  <button key={c} onClick={() => setNewGroupColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${newGroupColor === c ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleCreateGroup} disabled={createGroup.isPending || !newGroupName.trim()}>
              {createGroup.isPending ? 'Creating…' : 'Create Group'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Users Page ───────────────────────────────────────────────────────────

export default function Users() {
  const { data: users, isLoading } = useListUsers();
  const updateUser = useUpdateUser();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

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
        {isAdmin && (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={() => { setAddDialogOpen(true); setAddError(''); }} className="gap-2">
              <UserPlus className="w-4 h-4" /> {t('users.addUser')}
            </Button>
          </motion.div>
        )}
      </motion.div>

      <Tabs defaultValue="members">
        <TabsList className="mb-4">
          <TabsTrigger value="members" className="gap-1.5">
            <Users2 className="w-3.5 h-3.5" /> {t('nav.users')}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="teams" className="gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Teams
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="groups" className="gap-1.5">
              <Users2 className="w-3.5 h-3.5" /> Groups
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members">
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
                      {isAdmin && <TableHead className="text-right">{t('users.tableActions')}</TableHead>}
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
                          {isAdmin && <TableCell><Skeleton className="h-7 w-14 ml-auto" /></TableCell>}
                        </TableRow>
                      ))
                    ) : users?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-10 text-muted-foreground">{t('users.noUsersYet')}</TableCell>
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
                                {(user.subroles?.length ?? 0) > 0
                                  ? user.subroles!.map(sr => <SubroleBadge key={sr} subrole={sr} />)
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
                            {isAdmin && (
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
                            )}
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="teams">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 22 }}
            >
              <TeamsManagement />
            </motion.div>
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="groups">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 22 }}
            >
              <GroupsManagement />
            </motion.div>
          </TabsContent>
        )}
      </Tabs>

      {/* Add User Dialog */}
      {isAdmin && (
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
      )}

      {/* Edit User Dialog */}
      {isAdmin && (
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
      )}
    </PageTransition>
  );
}
