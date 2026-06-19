import { useListGames, useCreateGame, getListGamesQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Games() {
  const { data: games, isLoading } = useListGames();
  const createGame = useCreateGame();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  const [open, setOpen] = useState(false);
  const [robloxGameId, setRobloxGameId] = useState('');
  const [name, setName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createGame.mutateAsync({
      data: { robloxGameId, name }
    });
    queryClient.invalidateQueries({ queryKey: getListGamesQueryKey() });
    setOpen(false);
    setRobloxGameId('');
    setName('');
  };

  return (
    <PageTransition>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.games')}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>{t('common.create')} Game</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link New Game</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Roblox Game ID</label>
                <Input required value={robloxGameId} onChange={e => setRobloxGameId(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <Button type="submit" disabled={createGame.isPending}>
                {createGame.isPending ? t('common.loading') : t('common.save')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Roblox ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">{t('common.loading')}</TableCell></TableRow>
              ) : games?.map(game => (
                <TableRow key={game.id}>
                  <TableCell className="font-medium">{game.name}</TableCell>
                  <TableCell className="text-muted-foreground">{game.robloxGameId}</TableCell>
                  <TableCell>
                    <Badge variant={game.isActive ? 'default' : 'secondary'}>
                      {game.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/games/${game.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                      View Details
                    </Link>
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
