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

export default function Users() {
  const { data: users, isLoading } = useListUsers();
  const updateUser = useUpdateUser();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [role, setRole] = useState<'admin' | 'collaborator'>('collaborator');

  const handleUpdate = async (id: number) => {
    await updateUser.mutateAsync({ id, data: { role } });
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    setSelectedUser(null);
  };

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
                <TableRow><TableCell colSpan={5} className="text-center py-8">{t('common.loading')}</TableCell></TableRow>
              ) : users?.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.robloxAvatarUrl ? (
                        <img src={user.robloxAvatarUrl} alt="" className="w-8 h-8 rounded-full bg-muted" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                          {user.robloxUsername.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{user.robloxDisplayName || user.robloxUsername}</div>
                        <div className="text-xs text-muted-foreground">@{user.robloxUsername}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.subroles?.map(sr => (
                        <Badge key={sr} variant="outline" className="text-xs">{sr}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {user.groups && user.groups.length > 0 ? `(${user.groups.join(', ')})` : ''}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog open={selectedUser === user.id} onOpenChange={(open) => {
                      if (open) {
                        setSelectedUser(user.id);
                        setRole(user.role);
                      } else {
                        setSelectedUser(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">{t('common.edit')}</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User Role</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Role</label>
                            <Select value={role} onValueChange={(v: 'admin' | 'collaborator') => setRole(v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="collaborator">Collaborator</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={() => handleUpdate(user.id)} disabled={updateUser.isPending}>
                            {updateUser.isPending ? t('common.loading') : t('common.save')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
