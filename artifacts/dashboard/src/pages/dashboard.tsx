import { useState } from 'react';
import { useListUsers, useListBoards, useGetGroupInfo } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Columns2, CalendarDays, Shield, ChevronDown, ChevronRight, Eye, Lock, Gamepad2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

const GROUP_ID = '1030701459';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: boards, isLoading: boardsLoading } = useListBoards();
  const { data: group, isLoading: groupLoading } = useGetGroupInfo(GROUP_ID);

  const [groupExpanded, setGroupExpanded] = useState(false);

  const isLoading = usersLoading || boardsLoading;

  const adminCount = users?.filter(u => u.role === 'admin').length ?? 0;
  const collaboratorCount = users?.filter(u => u.role === 'collaborator').length ?? 0;

  const stats = [
    {
      label: 'Team Members',
      value: users?.length ?? 0,
      sub: `${adminCount} admin${adminCount !== 1 ? 's' : ''} · ${collaboratorCount} collaborator${collaboratorCount !== 1 ? 's' : ''}`,
      icon: Users,
      iconColor: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Planning Boards',
      value: boards?.length ?? 0,
      sub: boards?.length === 0 ? 'No boards yet — create one in Planning' : `${boards?.length} active board${(boards?.length ?? 0) !== 1 ? 's' : ''}`,
      icon: Columns2,
      iconColor: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
  ];

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Welcome header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, <span className="text-primary">{user?.robloxDisplayName || user?.robloxUsername}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your studio.</p>
        </div>

        {/* Stats row */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-[100px]" /></CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[60px] mb-1" />
                  <Skeleton className="h-3 w-[140px]" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={item}>
                <Card className="hover:border-border/80 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Roblox Group section */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Roblox Group</h2>
            {!isAdmin && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" /> CCU &amp; visits visible
              </span>
            )}
          </div>

          {groupLoading ? (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : group ? (
            <Card className="overflow-hidden">
              {/* Group header */}
              <button
                className="w-full text-left"
                onClick={() => setGroupExpanded(!groupExpanded)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {group.thumbnailUrl ? (
                      <img src={group.thumbnailUrl} alt={group.name} className="w-14 h-14 rounded-xl object-cover bg-muted flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-7 h-7 text-primary/60" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-base truncate">{group.name}</h3>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {formatNumber(group.memberCount)} members
                        </Badge>
                      </div>
                      {group.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{group.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {group.games.length > 0 ? `${group.games.length} game${group.games.length !== 1 ? 's' : ''}` : 'No public games yet'}
                      </p>
                    </div>
                    <span className="text-muted-foreground flex-shrink-0">
                      {groupExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                  </div>
                </CardContent>
              </button>

              {/* Games list */}
              {groupExpanded && (
                <div className="border-t border-border">
                  {group.games.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No public games yet.</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Games will appear here once published on Roblox.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {group.games.map((game) => (
                        <div key={game.universeId} className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            {game.thumbnailUrl ? (
                              <img src={game.thumbnailUrl} alt={game.name} className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Gamepad2 className="w-6 h-6 text-muted-foreground/40" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm truncate">{game.name}</span>
                                {game.isPrivate && (
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-border/60 text-muted-foreground flex-shrink-0">
                                    <Lock className="w-2.5 h-2.5 mr-0.5" /> Private
                                  </Badge>
                                )}
                              </div>

                              {/* CCU & Visits — visible to all */}
                              {!game.isPrivate && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                    <span><strong className="text-foreground">{formatNumber(game.playing)}</strong> playing</span>
                                  </span>
                                  <span>
                                    <strong className="text-foreground">{formatNumber(game.visits)}</strong> visits
                                  </span>
                                  <span>
                                    <strong className="text-foreground">{formatNumber(game.favoritedCount)}</strong> favorites
                                  </span>
                                </div>
                              )}

                              {game.isPrivate && (
                                <p className="text-xs text-muted-foreground">Stats available once the game is public.</p>
                              )}

                              {/* Revenue — admin only */}
                              {isAdmin && !game.isPrivate && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400/80">
                                  <TrendingUp className="w-3 h-3" />
                                  <span>Revenue data requires Roblox Open Cloud API key (admin)</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <CardContent className="p-5 text-center text-sm text-muted-foreground">
                Unable to load group info from Roblox.
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Team members preview */}
        {!usersLoading && users && users.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Team</h2>
              <Link href="/users" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Manage →
              </Link>
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3">
                  {users.slice(0, 8).map(u => (
                    <div key={u.id} className="flex items-center gap-2">
                      {u.robloxAvatarUrl ? (
                        <img src={u.robloxAvatarUrl} alt="" className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs flex-shrink-0">
                          {u.robloxUsername.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate max-w-[100px]">{u.robloxDisplayName || u.robloxUsername}</div>
                        <div className={`text-[10px] font-medium ${u.role === 'admin' ? 'text-amber-400' : 'text-indigo-400'} flex items-center gap-0.5`}>
                          {u.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                          <span className="capitalize">{u.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {users.length > 8 && (
                    <div className="flex items-center text-xs text-muted-foreground">+{users.length - 8} more</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Planning boards preview */}
        {!boardsLoading && boards && boards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent Boards</h2>
              <Link href="/planning" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {boards.slice(0, 3).map(board => (
                <Link key={board.id} href="/planning">
                  <Card className="hover:border-primary/30 cursor-pointer transition-colors group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Columns2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">{board.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(board.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && (!users || users.length === 0) && (!boards || boards.length === 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="border-dashed">
              <CardContent className="p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Studio ready</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add team members in Users, and create planning boards to get started.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
