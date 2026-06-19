import { useListUsers, useUpdateUser, getListUsersQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Shield, Users2 } from 'lucide-react';

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 gap-1">
        <Shield className="w-3 h-3" />
        Admin
      </Badge>
    );
  }
  return (
    <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 gap-1">
      <Users2 className="w-3 h-3" />
      Collaborator
    </Badge>
  );
}

const SUBROLE_OPTIONS = ['Scripter', 'UI Maker', 'Builder', 'Modeler', 'Animator', 'Sound Designer', 'Game Designer', 'Investor'];
const GROUP_OPTIONS = ['Core Team', 'Dev Team', 'Art Team', 'Marketing Team', 'Investors'];

export default function Users() {
  const { data: users, isLoading } = useListUsers();
  const updateUser = useUpdateUser();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [role, setRole] = useState<'admin' | 'collaborator'>('collaborator');
  const [subroles, setSubroles] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [customSubrole, setCustomSubrole] = useState('');
  const [customGroup, setCustomGroup] = useState('');

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
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    setSelectedUser(null);
  };

  const toggleSubrole = (sr: string) => {
    setSubroles(prev => prev.includes(sr) ? prev.filter(x => x !== sr) : [...prev, sr]);
  };

  const toggleGroup = (g: string) => {
    setGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const addCustomSubrole = () => {
    const v = customSubrole.trim();
    if (v && !subroles.includes(v)) { setSubroles(prev => [...prev, v]); }
    setCustomSubrole('');
  };

  const addCustomGroup = () => {
    const v = customGroup.trim();
    if (v && !groups.includes(v)) { setGroups(prev => [...prev, v]); }
    setCustomGroup('');
  };

  const editingUser = users?.find(u => u.id === selectedUser);

  return (
    <PageTransition>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.users')}</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Subroles</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
              ) : users?.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.robloxAvatarUrl ? (
                        <img src={user.robloxAvatarUrl} alt="" className="w-8 h-8 rounded-full bg-muted" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                          {user.robloxUsername.charAt(0).toUpperCase()}
                        </div>
                      )}
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
                      {user.subroles?.map(sr => (
                        <Badge key={sr} variant="outline" className="text-xs border-border/60 text-muted-foreground">{sr}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.groups?.map(g => (
                        <span key={g} className="text-xs text-muted-foreground">({g})</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(user as any)}>
                      {t('common.edit')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={selectedUser !== null} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User — {editingUser?.robloxDisplayName || editingUser?.robloxUsername}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select value={role} onValueChange={(v: 'admin' | 'collaborator') => setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-amber-400" /> Admin</span>
                  </SelectItem>
                  <SelectItem value="collaborator">
                    <span className="flex items-center gap-2"><Users2 className="w-3.5 h-3.5 text-indigo-400" /> Collaborator</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Subroles</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {SUBROLE_OPTIONS.map(sr => (
                  <button
                    key={sr}
                    onClick={() => toggleSubrole(sr)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      subroles.includes(sr)
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'border-border/60 text-muted-foreground hover:border-primary/30'
                    }`}
                  >{sr}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Custom subrole..."
                  value={customSubrole}
                  onChange={e => setCustomSubrole(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSubrole())}
                  className="h-8 text-sm"
                />
                <Button size="sm" variant="outline" onClick={addCustomSubrole} className="h-8">Add</Button>
              </div>
              {subroles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {subroles.map(sr => (
                    <Badge key={sr} variant="outline" className="text-xs cursor-pointer hover:border-destructive hover:text-destructive" onClick={() => toggleSubrole(sr)}>
                      {sr} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Groups</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {GROUP_OPTIONS.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleGroup(g)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      groups.includes(g)
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                        : 'border-border/60 text-muted-foreground hover:border-indigo-500/30'
                    }`}
                  >{g}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Custom group..."
                  value={customGroup}
                  onChange={e => setCustomGroup(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomGroup())}
                  className="h-8 text-sm"
                />
                <Button size="sm" variant="outline" onClick={addCustomGroup} className="h-8">Add</Button>
              </div>
              {groups.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {groups.map(g => (
                    <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 cursor-pointer hover:border-red-400/50 hover:text-red-400" onClick={() => toggleGroup(g)}>
                      ({g}) ×
                    </span>
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
