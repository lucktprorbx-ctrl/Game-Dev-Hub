import { useListGames, useCreateGame, useDeleteGame, getListGamesQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Trash2, ChevronRight, Gamepad2, Users, Globe } from 'lucide-react';

function extractGameId(url: string): string {
  const match = url.match(/games\/(\d+)/i) || url.match(/placeId=(\d+)/i);
  if (match) return match[1];
  if (/^\d+$/.test(url.trim())) return url.trim();
  return url.trim();
}

export default function Games() {
  const { data: games, isLoading } = useListGames();
  const createGame = useCreateGame();
  const deleteGame = useDeleteGame();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [gameLink, setGameLink] = useState('');
  const [groupLink, setGroupLink] = useState('');
  const [description, setDescription] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListGamesQueryKey() });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const robloxGameId = extractGameId(gameLink);
    await createGame.mutateAsync({
      data: { robloxGameId, name, gameLink, groupLink: groupLink || undefined, description: description || undefined }
    });
    invalidate();
    setOpen(false);
    setName(''); setGameLink(''); setGroupLink(''); setDescription('');
  };

  const handleDelete = async (id: number) => {
    await deleteGame.mutateAsync({ id });
    invalidate();
  };

  return (
    <PageTransition>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Games</h1>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Gamepad2 className="w-4 h-4" /> Link Game
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-lg bg-muted/20 animate-pulse" />)}
        </div>
      ) : games?.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium mb-1">No games linked yet</p>
          <p className="text-sm">Click "Link Game" to add your first Roblox game.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {games?.map(game => (
            <Card key={game.id} className="group hover:border-border/80 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Gamepad2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{game.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">ID: {game.robloxGameId}</p>
                    </div>
                  </div>
                  <Badge variant={game.isActive ? 'default' : 'secondary'} className="flex-shrink-0 text-xs">
                    {game.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {game.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{game.description}</p>
                )}
                <div className="flex flex-col gap-1.5 mb-4">
                  {game.gameLink && (
                    <a href={game.gameLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors truncate">
                      <Globe className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Game page</span>
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                    </a>
                  )}
                  {game.groupLink && (
                    <a href={game.groupLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors truncate">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Group page</span>
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleDelete(game.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    data-testid={`button-delete-game-${game.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link href={`/games/${game.id}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                    View stats <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" /> Link a Roblox Game
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Game Name <span className="text-destructive">*</span></label>
              <Input required placeholder="e.g. RoVerse Horizon" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Game Link <span className="text-destructive">*</span>
                <span className="text-muted-foreground text-xs font-normal ml-1">(Roblox URL or Game ID)</span>
              </label>
              <Input
                required
                placeholder="https://www.roblox.com/games/12345678/..."
                value={gameLink}
                onChange={e => setGameLink(e.target.value)}
              />
              {gameLink && (
                <p className="text-xs text-muted-foreground mt-1">
                  Game ID detected: <span className="text-primary font-mono">{extractGameId(gameLink)}</span>
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Group Link
                <span className="text-muted-foreground text-xs font-normal ml-1">(optional)</span>
              </label>
              <Input
                placeholder="https://www.roblox.com/communities/..."
                value={groupLink}
                onChange={e => setGroupLink(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Description
                <span className="text-muted-foreground text-xs font-normal ml-1">(optional)</span>
              </label>
              <Textarea
                placeholder="A short description of this game..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="resize-none h-20 text-sm"
              />
            </div>
            <Button type="submit" className="w-full" disabled={createGame.isPending}>
              {createGame.isPending ? 'Linking...' : 'Link Game'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
