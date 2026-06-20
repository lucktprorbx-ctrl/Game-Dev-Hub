import { useListUsers, useListBoards } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/ui/page-transition';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Columns2, CalendarDays, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: boards, isLoading: boardsLoading } = useListBoards();

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
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-[100px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[60px] mb-1" />
                  <Skeleton className="h-3 w-[140px]" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2"
          >
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

        {/* Team members preview */}
        {!usersLoading && users && users.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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

        {/* Empty state for new studios */}
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
