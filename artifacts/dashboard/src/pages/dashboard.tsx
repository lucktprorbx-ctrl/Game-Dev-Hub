import { useState, useEffect } from 'react';
import { useListUsers, useListBoards, useGetGroupInfo } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Columns2, CalendarDays, Shield, ChevronRight, Eye, Lock, Gamepad2 } from 'lucide-react';
import { motion, animate, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';

const GROUP_ID = '1030701459';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function CountUp({ to, duration = 1.2 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) { setValue(Math.round(v)); },
    });
    return controls.stop;
  }, [to, duration]);
  return <>{value}</>;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      label: t('dashboard.teamMembers'),
      value: users?.length ?? 0,
      sub: `${t('dashboard.admins', { count: adminCount })} · ${t('dashboard.collaborators', { count: collaboratorCount })}`,
      icon: Users,
      iconColor: 'text-amber-400',
      bg: 'bg-amber-500/10',
      accent: 'hover:border-amber-500/30 hover:shadow-amber-500/5',
    },
    {
      label: t('dashboard.planningBoards'),
      value: boards?.length ?? 0,
      sub: (boards?.length ?? 0) === 0 ? t('dashboard.noBoardsYet') : t('dashboard.activeBoards', { count: boards?.length ?? 0 }),
      icon: Columns2,
      iconColor: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      accent: 'hover:border-indigo-500/30 hover:shadow-indigo-500/5',
    },
  ];

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t('dashboard.welcomeBack', { name: '\x00' }).split('\x00')[0]}
            <motion.span
              className="text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {user?.robloxDisplayName || user?.robloxUsername}
            </motion.span>
            {t('dashboard.welcomeBack', { name: '\x00' }).split('\x00')[1]}
          </h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </motion.div>

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
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Card className={`transition-all duration-200 hover:shadow-lg ${stat.accent}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                      <motion.div
                        whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                        className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}
                      >
                        <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                      </motion.div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        <CountUp to={stat.value} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Roblox Group section */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 22 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t('dashboard.robloxGroup')}</h2>
            {!isAdmin && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" /> {t('dashboard.ccuVisible')}
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
              <motion.button
                className="w-full text-left"
                onClick={() => setGroupExpanded(!groupExpanded)}
                whileHover={{ backgroundColor: 'hsl(var(--muted)/0.3)' }}
                whileTap={{ scale: 0.995 }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {group.thumbnailUrl ? (
                      <motion.img
                        src={group.thumbnailUrl}
                        alt={group.name}
                        className="w-14 h-14 rounded-xl object-cover bg-muted flex-shrink-0"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      />
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
                    <motion.span
                      animate={{ rotate: groupExpanded ? 90 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="text-muted-foreground flex-shrink-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.span>
                  </div>
                </CardContent>
              </motion.button>

              <AnimatePresence>
                {groupExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
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
                        <motion.div
                          className="divide-y divide-border"
                          initial="hidden"
                          animate="show"
                          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                        >
                          {group.games.map((game) => (
                            <motion.div
                              key={game.universeId}
                              variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                              className="px-5 py-4"
                            >
                              <div className="flex items-start gap-3">
                                {game.thumbnailUrl ? (
                                  <motion.img
                                    src={game.thumbnailUrl}
                                    alt={game.name}
                                    className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                                    whileHover={{ scale: 1.05 }}
                                  />
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
                                  {!game.isPrivate && (
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <motion.span
                                          className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"
                                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                                          transition={{ duration: 2, repeat: Infinity }}
                                        />
                                        <span><strong className="text-foreground">{formatNumber(game.playing ?? 0)}</strong> playing</span>
                                      </span>
                                      <span><strong className="text-foreground">{formatNumber(game.visits ?? 0)}</strong> visits</span>
                                      <span><strong className="text-foreground">{formatNumber(game.favoritedCount ?? 0)}</strong> favorites</span>
                                    </div>
                                  )}
                                  {game.isPrivate && (
                                    <p className="text-xs text-muted-foreground">Stats available once the game is public.</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-5 text-center text-sm text-muted-foreground">
                {t('dashboard.unableToLoadGroup')}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Team members preview */}
        {!usersLoading && users && users.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, type: 'spring', stiffness: 200, damping: 22 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{t('dashboard.team')}</h2>
              <Link href="/users" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                {t('dashboard.manage')}
              </Link>
            </div>
            <Card>
              <CardContent className="p-4">
                <motion.div
                  className="flex flex-wrap gap-3"
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                >
                  {users.slice(0, 8).map(u => (
                    <motion.div
                      key={u.id}
                      variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 18 } } }}
                      whileHover={{ y: -2, scale: 1.05 }}
                      className="flex items-center gap-2"
                    >
                      {u.robloxAvatarUrl ? (
                        <img src={u.robloxAvatarUrl} alt="" className="w-8 h-8 rounded-full bg-muted flex-shrink-0 ring-1 ring-border/50" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs flex-shrink-0">
                          {u.robloxUsername.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate max-w-[100px]">{u.robloxDisplayName || u.robloxUsername}</div>
                        <div className={`text-[10px] font-medium ${u.role === 'admin' ? 'text-red-400' : 'text-indigo-400'} flex items-center gap-0.5`}>
                          {u.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                          <span>{u.role === 'admin' ? t('dashboard.admin') : t('dashboard.collaborator')}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {users.length > 8 && (
                    <div className="flex items-center text-xs text-muted-foreground">{t('dashboard.moreUsers', { count: users.length - 8 })}</div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Planning boards preview */}
        {!boardsLoading && boards && boards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 22 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent Boards</h2>
              <Link href="/planning" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                View all →
              </Link>
            </div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            >
              {boards.slice(0, 3).map(board => (
                <motion.div
                  key={board.id}
                  variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } } }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href="/planning">
                    <Card className="hover:border-primary/30 cursor-pointer transition-colors group hover:shadow-md hover:shadow-primary/5">
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
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && (!users || users.length === 0) && (!boards || boards.length === 0) && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
            <Card className="border-dashed">
              <CardContent className="p-10 text-center">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
                >
                  <Shield className="w-7 h-7 text-primary" />
                </motion.div>
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
