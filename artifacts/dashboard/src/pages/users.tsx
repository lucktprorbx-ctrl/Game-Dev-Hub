import {
  useListUsers, useUpdateUser, useCreateUser, useDeleteUser, getListUsersQueryKey,
  useListTeams, useCreateTeam, useDeleteTeam, useAddTeamMember, useRemoveTeamMember, getListTeamsQueryKey,
} from '@workspace/api-client-react';
import type { Team } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Shield, Users2, UserPlus, Trash2, AlertCircle, CheckCircle2, Ban, Plus, X, Palette,
  MessageSquare, Edit2, ChevronDown, ChevronUp, Search, Wrench, Power, LayoutGrid, List,
  Calendar, Hash,
} from 'lucide-react';
import { getSubroleClasses } from '@/lib/role-colors';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { cn } from '@/lib/utils';

/* ── Types ────────────────────────────────────────────────────────────────── */

type UserListUser = {
  id: number;
  robloxUsername: string;
  robloxDisplayName?: string | null;
  robloxAvatarUrl?: string | null;
  discordUsername?: string | null;
  role: 'admin' | 'collaborator';
  subroles: string[];
  groups: string[];
  createdAt: string;
};

type ViewMode = 'grid' | 'list';

/* ── Constants ────────────────────────────────────────────────────────────── */

const SUBROLE_OPTIONS = ['Scripter', 'UI Maker', 'Builder', 'Modeler', 'Animator', 'Sound Designer', 'Game Designer', 'Investor', 'Content Creator Manager'];
const GROUP_OPTIONS = ['Core Team', 'Dev Team', 'Art Team', 'Marketing Team', 'Investors'];
const TEAM_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#14b8a6', '#f97316'];
const GROUP_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#14b8a6', '#f97316'];

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22, delay: i * 0.04 },
  }),
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
};

/* ── Small components ─────────────────────────────────────────────────────── */

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') {
    return (
      <Badge className="bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 gap-1 text-[10px] px-2 py-0.5 font-semibold">
        <Shield className="w-2.5 h-2.5" /> Admin
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 gap-1 text-[10px] px-2 py-0.5 font-semibold">
      <Users2 className="w-2.5 h-2.5" /> Collab.
    </Badge>
  );
}

function SubroleBadge({ subrole }: { subrole: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getSubroleClasses(subrole)}`}>
      {subrole}
    </span>
  );
}

/* ── User Card (Grid mode) ────────────────────────────────────────────────── */

function UserCardGrid({
  user, index, isAdmin, onEdit, onDelete,
}: {
  user: UserListUser;
  index: number;
  isAdmin: boolean;
  onEdit: (user: UserListUser) => void;
  onDelete: (id: number) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const joinedDate = new Date(user.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  const isAdminRole = user.role === 'admin';

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className={cn(
        "group relative bg-card border rounded-2xl overflow-hidden transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/25",
        isAdminRole ? "border-red-500/20 hover:border-red-500/35" : "border-border/50 hover:border-border"
      )}
    >
      {/* Role accent strip */}
      <div className={cn(
        "h-0.5 w-full",
        isAdminRole
          ? "bg-gradient-to-r from-red-500 via-orange-500 to-red-500"
          : "bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"
      )} />

      <div className="p-4 space-y-3.5">
        {/* Avatar + info */}
        <div className="flex items-start gap-3.5">
          <div className="relative flex-shrink-0">
            {user.robloxAvatarUrl ? (
              <motion.img
                src={user.robloxAvatarUrl}
                alt=""
                className={cn(
                  "w-14 h-14 rounded-xl object-cover ring-2 bg-muted",
                  isAdminRole ? "ring-red-500/30" : "ring-blue-500/20"
                )}
                whileHover={{ scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              />
            ) : (
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ring-2",
                isAdminRole
                  ? "bg-red-500/10 text-red-400 ring-red-500/20"
                  : "bg-blue-500/10 text-blue-400 ring-blue-500/20"
              )}>
                {user.robloxUsername.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center",
              isAdminRole ? "bg-red-500" : "bg-blue-500"
            )}>
              {isAdminRole
                ? <Shield className="w-2 h-2 text-white" />
                : <Users2 className="w-2 h-2 text-white" />
              }
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight truncate">
                  {user.robloxDisplayName || user.robloxUsername}
                </p>
                {user.robloxDisplayName && (
                  <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                    @{user.robloxUsername}
                  </p>
                )}
              </div>
              <RoleBadge role={user.role} />
            </div>

            {/* Subroles */}
            {(user.subroles?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {user.subroles.slice(0, 2).map(sr => (
                  <SubroleBadge key={sr} subrole={sr} />
                ))}
                {user.subroles.length > 2 && (
                  <span className="text-[10px] text-muted-foreground/60 self-center">
                    +{user.subroles.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Discord */}
            {user.discordUsername && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <MessageSquare className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                <span className="text-[11px] text-muted-foreground/70 truncate">{user.discordUsername}</span>
              </div>
            )}
          </div>
        </div>

        {/* Groups */}
        {(user.groups?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1">
            {user.groups.slice(0, 3).map(g => (
              <span key={g} className="px-2 py-0.5 rounded-full text-[10px] bg-muted/50 text-muted-foreground border border-border/40 font-medium">
                {g}
              </span>
            ))}
            {user.groups.length > 3 && (
              <span className="text-[10px] text-muted-foreground/50 self-center">+{user.groups.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <Calendar className="w-3 h-3" />
            {joinedDate}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 text-muted-foreground/40 hover:text-muted-foreground rounded-lg hover:bg-muted/40 transition-colors"
              title="Details"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(user)}
                  className="p-1.5 text-muted-foreground/40 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                  title={t('users.editUser')}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(user.id)}
                  className="p-1.5 text-muted-foreground/30 hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                  title={t('users.deleteMember')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="px-4 py-3 space-y-2 bg-muted/5">
              {user.discordUsername && (
                <div className="flex items-center gap-2 text-xs">
                  <MessageSquare className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                  <span className="text-muted-foreground">{t('users.discordHandle')}:</span>
                  <span className="font-medium">{user.discordUsername}</span>
                </div>
              )}
              {(user.groups?.length ?? 0) > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <Users2 className="w-3 h-3 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{t('users.tableGroups')}:</span>
                  <div className="flex flex-wrap gap-1">
                    {user.groups.map(g => (
                      <span key={g} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">{g}</span>
                    ))}
                  </div>
                </div>
              )}
              {(user.subroles?.length ?? 0) > 1 && (
                <div className="flex items-start gap-2 text-xs">
                  <Palette className="w-3 h-3 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{t('users.tableSubroles')}:</span>
                  <div className="flex flex-wrap gap-1">
                    {user.subroles.map(sr => <SubroleBadge key={sr} subrole={sr} />)}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                <Hash className="w-3 h-3" />
                <span>ID: {user.id}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── User Card (List mode) ────────────────────────────────────────────────── */

function UserCardList({
  user, index, isAdmin, onEdit, onDelete,
}: {
  user: UserListUser;
  index: number;
  isAdmin: boolean;
  onEdit: (user: UserListUser) => void;
  onDelete: (id: number) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const joinedDate = new Date(user.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  const isAdminRole = user.role === 'admin';

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className={cn(
        "bg-card border rounded-xl overflow-hidden transition-colors",
        isAdminRole ? "border-red-500/15 hover:border-red-500/30" : "border-border/50 hover:border-border/80"
      )}
    >
      <div className="flex items-center gap-3 p-3 sm:p-4">
        {/* Avatar */}
        <div className="flex-shrink-0 relative">
          {user.robloxAvatarUrl ? (
            <img
              src={user.robloxAvatarUrl}
              alt=""
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover ring-1 bg-muted",
                isAdminRole ? "ring-red-500/25" : "ring-border/50"
              )}
            />
          ) : (
            <div className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-sm ring-1",
              isAdminRole
                ? "bg-red-500/10 text-red-400 ring-red-500/20"
                : "bg-primary/10 text-primary ring-border/50"
            )}>
              {user.robloxUsername.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card",
            isAdminRole ? "bg-red-500" : "bg-blue-500"
          )} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate max-w-[120px] sm:max-w-none">
              {user.robloxDisplayName || user.robloxUsername}
            </span>
            <RoleBadge role={user.role} />
          </div>
          {user.robloxDisplayName && (
            <p className="text-xs text-muted-foreground/60 truncate">@{user.robloxUsername}</p>
          )}
          {(user.subroles?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <SubroleBadge subrole={user.subroles[0]} />
              {user.subroles.length > 1 && (
                <span className="text-[10px] text-muted-foreground/60">+{user.subroles.length - 1}</span>
              )}
            </div>
          )}
          {user.discordUsername && (
            <div className="flex items-center gap-1 mt-0.5">
              <MessageSquare className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground/70 truncate">{user.discordUsername}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-muted-foreground/50 hover:text-muted-foreground rounded-lg hover:bg-muted/40 transition-colors"
            title="Details"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(user)}
                className="p-1.5 text-muted-foreground/50 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                title={t('users.editUser')}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(user.id)}
                className="p-1.5 text-muted-foreground/30 hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                title={t('users.deleteMember')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="px-4 py-3 space-y-2.5 bg-muted/10">
              {user.discordUsername && (
                <div className="flex items-center gap-2 text-xs">
                  <MessageSquare className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                  <span className="text-muted-foreground">{t('users.discordHandle')}:</span>
                  <span className="font-medium">{user.discordUsername}</span>
                </div>
              )}
              {(user.groups?.length ?? 0) > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <Users2 className="w-3 h-3 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{t('users.tableGroups')}:</span>
                  <div className="flex flex-wrap gap-1">
                    {user.groups.map(g => (
                      <span key={g} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">{g}</span>
                    ))}
                  </div>
                </div>
              )}
              {(user.subroles?.length ?? 0) > 1 && (
                <div className="flex items-start gap-2 text-xs">
                  <Palette className="w-3 h-3 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{t('users.tableSubroles')}:</span>
                  <div className="flex flex-wrap gap-1">
                    {user.subroles.map(sr => <SubroleBadge key={sr} subrole={sr} />)}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                <span>{t('users.joinedOn')}: {joinedDate}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Teams Management ─────────────────────────────────────────────────────── */

function TeamsManagement() {
  const { data: teams, isLoading } = useListTeams();
  const { data: users } = useListUsers();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

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
    setNewTeamName(''); setNewTeamDesc(''); setNewTeamColor(TEAM_COLORS[0]);
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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
            <Users2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t('users.teamsVisibility')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-md">{t('users.teamsVisibilityDesc')}</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 flex-shrink-0" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" /> {t('users.newTeam')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : teamList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-border/50 rounded-xl bg-muted/5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
            <Users2 className="w-5 h-5 text-indigo-400/60" />
          </div>
          <p className="font-semibold mb-1 text-sm">{t('users.noTeamsCreate')}</p>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs">{t('users.noTeamsCreateDesc')}</p>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> {t('users.createFirstTeam')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamList.map(team => {
            const memberIds = new Set(team.members.map(m => m.userId));
            const eligible = userList.filter(u => !memberIds.has(u.id));
            const isAdding = addMemberTeam?.id === team.id;

            return (
              <Card key={team.id} className="border border-border/50 overflow-hidden">
                <div className="h-1 w-full" style={{ backgroundColor: team.color }} />
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: team.color }} />
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold leading-tight">{team.name}</CardTitle>
                        {team.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{team.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors p-1 rounded flex-shrink-0"
                      title={t('users.deleteTeam')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                        {t('users.membersOf')} · {team.members.length}
                      </span>
                    </div>
                    {team.members.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {team.members.map(m => (
                          <div key={m.userId} className="group flex items-center gap-1.5 bg-muted/40 border border-border/50 rounded-full pl-1.5 pr-1 py-0.5">
                            {m.avatarUrl
                              ? <img src={m.avatarUrl} alt="" className="w-4 h-4 rounded-full flex-shrink-0" />
                              : <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">{(m.displayName || m.username).charAt(0)}</div>
                            }
                            <span className="text-xs font-medium">{m.displayName || m.username}</span>
                            <button
                              onClick={() => handleRemoveMember(team.id, m.userId)}
                              className="text-muted-foreground/30 hover:text-destructive transition-colors p-0.5 rounded-full"
                              title={t('users.remove')}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/50 italic">{t('users.noTeamsYet')}</p>
                    )}
                  </div>

                  {eligible.length > 0 && (
                    <div className="border-t border-border/40 pt-3">
                      {!isAdding ? (
                        <button
                          onClick={() => { setAddMemberTeam(team); setAddMemberUserId(''); }}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> {t('users.addMember')}
                        </button>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue placeholder={t('users.selectUser')} />
                            </SelectTrigger>
                            <SelectContent>
                              {eligible.map(u => (
                                <SelectItem key={u.id} value={String(u.id)} className="text-xs">
                                  {u.robloxDisplayName || u.robloxUsername}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" className="h-8 px-3 text-xs" disabled={!addMemberUserId} onClick={handleAddMember}>
                            {t('users.addMemberBtn')}
                          </Button>
                          <button onClick={() => { setAddMemberTeam(null); setAddMemberUserId(''); }} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
            <DialogTitle className="flex items-center gap-2">
              <Users2 className="w-4 h-4 text-indigo-400" /> {t('users.newTeamTitle')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">{t('users.newTeamSubtitle')}</p>
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('users.teamName')} <span className="text-destructive">*</span></label>
              <Input placeholder={t('users.teamNamePlaceholder')} value={newTeamName} onChange={e => setNewTeamName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateTeam()} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('users.descriptionLabel')} <span className="text-muted-foreground text-xs font-normal">{t('users.optional')}</span></label>
              <Input placeholder={t('users.descriptionPlaceholder')} value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('users.color')}</label>
              <div className="flex flex-wrap gap-2">
                {TEAM_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewTeamColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newTeamColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleCreateTeam} disabled={createTeam.isPending || !newTeamName.trim()}>
              {createTeam.isPending ? t('users.creating') : t('users.createTeam')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Groups Management ────────────────────────────────────────────────────── */

type UserGroupMember = { id: number; username: string; displayName: string | null; avatarUrl: string | null };
type UserGroup = { id: number; name: string; description: string | null; color: string; members: UserGroupMember[] };

function GroupsManagement() {
  const queryClient = useQueryClient();
  const { data: users } = useListUsers();
  const { t } = useTranslation();

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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <Users2 className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t('users.groupsMembers')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-md">{t('users.groupsMembersDesc')}</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 flex-shrink-0" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" /> {t('users.newGroup')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : groupList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-border/50 rounded-xl bg-muted/5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
            <Users2 className="w-5 h-5 text-amber-400/60" />
          </div>
          <p className="font-semibold mb-1 text-sm">{t('users.noGroupsCreate')}</p>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs">{t('users.noGroupsCreateDesc')}</p>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> {t('users.createFirstGroup')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupList.map(group => {
            const eligible = userList.filter(u => !group.members.some(m => m.id === u.id));
            const isAdding = addMemberGroupId === group.id;

            return (
              <Card key={group.id} className="border border-border/50 overflow-hidden">
                <div className="h-1 w-full" style={{ backgroundColor: group.color }} />
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: group.color }} />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm leading-tight">{group.name}</div>
                        {group.description && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">{group.description}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteGroup.mutate(group.id)}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors p-1 rounded flex-shrink-0"
                      title={t('users.deleteGroup')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                      {t('users.membersOf')} · {group.members.length}
                    </span>
                    {group.members.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {group.members.map(m => (
                          <div key={m.id} className="flex items-center gap-1.5 bg-muted/40 border border-border/50 rounded-full pl-1 pr-1.5 py-0.5">
                            {m.avatarUrl
                              ? <img src={m.avatarUrl} alt="" className="w-4 h-4 rounded-full flex-shrink-0" />
                              : <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">{m.username.charAt(0)}</div>
                            }
                            <span className="text-xs font-medium">{m.displayName || m.username}</span>
                            <button
                              onClick={() => removeMember.mutate({ groupId: group.id, userId: m.id })}
                              className="text-muted-foreground/30 hover:text-destructive transition-colors"
                              title={t('users.remove')}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/50 italic">{t('users.noGroupsYet')}</p>
                    )}
                  </div>

                  {eligible.length > 0 && (
                    <div className="border-t border-border/40 pt-3">
                      {!isAdding ? (
                        <button
                          onClick={() => { setAddMemberGroupId(group.id); setAddMemberUserId(''); }}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> {t('users.addMember')}
                        </button>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue placeholder={t('users.selectUser')} />
                            </SelectTrigger>
                            <SelectContent>
                              {eligible.map(u => (
                                <SelectItem key={u.id} value={String(u.id)} className="text-xs">
                                  {u.robloxDisplayName || u.robloxUsername}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" className="h-8 px-3 text-xs" disabled={!addMemberUserId} onClick={handleAddMember}>
                            {t('users.addMemberBtn')}
                          </Button>
                          <button onClick={() => { setAddMemberGroupId(null); setAddMemberUserId(''); }} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={(o) => { setCreateDialogOpen(o); if (!o) { setNewGroupName(''); setNewGroupDesc(''); setNewGroupColor(GROUP_COLORS[0]); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users2 className="w-4 h-4 text-amber-400" /> {t('users.newGroup')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('users.groupName')} <span className="text-destructive">*</span></label>
              <Input placeholder={t('users.groupNamePlaceholder')} value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateGroup()} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('users.descriptionLabel')} <span className="text-muted-foreground text-xs font-normal">{t('users.optional')}</span></label>
              <Input placeholder={t('users.descriptionPlaceholder')} value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('users.color')}</label>
              <div className="flex gap-2 flex-wrap">
                {GROUP_COLORS.map(c => (
                  <button key={c} onClick={() => setNewGroupColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newGroupColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleCreateGroup} disabled={createGroup.isPending || !newGroupName.trim()}>
              {createGroup.isPending ? t('users.creating') : t('users.createGroup')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Maintenance Settings ─────────────────────────────────────────────────── */

function MaintenanceSettings() {
  const { t } = useTranslation();
  const { data: status, refetch } = useMaintenanceMode();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status) {
      setEnabled(status.maintenanceMode);
      setMessage(status.message ?? '');
    }
  }, [status]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/admin/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceMode: enabled, message: message.trim() || null }),
        credentials: 'include',
      });
      await refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const isDirty = status
    ? (enabled !== status.maintenanceMode || (message.trim() || null) !== (status.message ?? null))
    : false;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <Wrench className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{t('maintenance.maintenanceSection')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t('maintenance.maintenanceSectionDesc')}</p>
        </div>
      </div>

      <Card className={cn("border transition-colors", enabled ? "border-amber-500/30 bg-amber-500/5" : "border-border/50")}>
        <CardContent className="p-5 space-y-5">
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t('maintenance.messageLabel')}</label>
            <Input
              placeholder={t('maintenance.messagePlaceholder')}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="text-sm bg-muted/20"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground/60">
              {status?.updatedAt && (
                <span>{t('maintenance.lastUpdated')}: {new Date(status.updatedAt).toLocaleString()}</span>
              )}
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || (!isDirty && !saved)}
                className={cn(saved && "bg-green-600 hover:bg-green-600")}
              >
                {saving ? t('maintenance.saving') : saved
                  ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />{t('maintenance.saved')}</>
                  : t('maintenance.save')}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">{t('maintenance.adminBanner')}</p>
              {message && <p className="text-xs text-muted-foreground mt-1">Message: "{message}"</p>}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ── Main Users Page ──────────────────────────────────────────────────────── */

export default function Users() {
  const { data: users, isLoading } = useListUsers();
  const updateUser = useUpdateUser();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [role, setRole] = useState<'admin' | 'collaborator'>('collaborator');
  const [subroles, setSubroles] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [discordUsername, setDiscordUsername] = useState('');
  const [customSubrole, setCustomSubrole] = useState('');
  const [customGroup, setCustomGroup] = useState('');

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRobloxId, setNewRobloxId] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'collaborator'>('collaborator');
  const [newDiscord, setNewDiscord] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  type RobloxPreview = {
    robloxId: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isBanned: boolean;
  };
  const [preview, setPreview] = useState<RobloxPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'collaborator'>('all');
  const [filterSubrole, setFilterSubrole] = useState('');

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
  }, [newRobloxId, t]);

  const resetAddDialog = () => {
    setNewRobloxId(''); setNewRole('collaborator'); setNewDiscord(''); setAddError('');
    setPreview(null); setPreviewError(''); setPreviewLoading(false);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });

  const openEdit = (user: UserListUser) => {
    setSelectedUser(user.id);
    setRole(user.role);
    setSubroles(user.subroles ?? []);
    setGroups(user.groups ?? []);
    setDiscordUsername(user.discordUsername ?? '');
    setCustomSubrole('');
    setCustomGroup('');
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    await updateUser.mutateAsync({
      id: selectedUser,
      data: { role, subroles, groups, discordUsername: discordUsername.trim() || null },
    });
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
      await createUser.mutateAsync({ data: { robloxId: id, role: newRole, discordUsername: newDiscord.trim() || null } });
      invalidate();
      setAddDialogOpen(false);
      resetAddDialog();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('users.failedAddUser');
      setAddError(message);
    } finally { setAddLoading(false); }
  };

  const toggleSubrole = (sr: string) => setSubroles(prev => prev.includes(sr) ? prev.filter(x => x !== sr) : [...prev, sr]);
  const toggleGroup = (g: string) => setGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const addCustomSubrole = () => {
    const v = customSubrole.trim().slice(0, 50);
    if (v && !subroles.includes(v)) setSubroles(prev => [...prev, v]);
    setCustomSubrole('');
  };

  const addCustomGroup = () => {
    const v = customGroup.trim().slice(0, 50);
    if (v && !groups.includes(v)) setGroups(prev => [...prev, v]);
    setCustomGroup('');
  };

  const editingUser = users?.find(u => u.id === selectedUser);
  const adminCount = users?.filter(u => u.role === 'admin').length ?? 0;
  const collaboratorCount = users?.filter(u => u.role === 'collaborator').length ?? 0;

  const filteredUsers = (users as UserListUser[] | undefined)?.filter(u => {
    const q = search.toLowerCase().trim();
    if (q) {
      const name = (u.robloxDisplayName || u.robloxUsername || '').toLowerCase();
      const username = (u.robloxUsername || '').toLowerCase();
      const discord = (u.discordUsername || '').toLowerCase();
      if (!name.includes(q) && !username.includes(q) && !discord.includes(q)) return false;
    }
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterSubrole && !(u.subroles || []).some(sr => sr.toLowerCase().includes(filterSubrole.toLowerCase()))) return false;
    return true;
  });

  const isFiltering = !!(search || filterRole !== 'all' || filterSubrole);

  return (
    <PageTransition>
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('nav.users')}</h1>
          {!isLoading && users && (
            <p className="text-sm text-muted-foreground mt-1">
              {users.length} {users.length !== 1 ? t('users.totalMembersLabelPlural') : t('users.totalMembersLabel')}
              {' · '}{adminCount} admin{adminCount !== 1 ? 's' : ''}
              {' · '}{collaboratorCount} {t('users.collaboratorLabel').toLowerCase()}
            </p>
          )}
        </div>
        {isAdmin && (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={() => { setAddDialogOpen(true); setAddError(''); }} className="gap-2 w-full sm:w-auto">
              <UserPlus className="w-4 h-4" /> {t('users.addUser')}
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Stats cards */}
      {!isLoading && users && users.length > 0 && (
        <motion.div
          className="grid grid-cols-3 gap-2 sm:gap-3 mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 200, damping: 22 }}
        >
          <Card className="border-border/50 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-muted to-muted/30" />
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                <Users2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold leading-none">{users.length}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">Total</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/20 bg-red-500/5 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold leading-none text-red-400">{adminCount}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">Admin</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-blue-500/5 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400" />
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Users2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold leading-none text-blue-400">{collaboratorCount}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">Collab.</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Tabs defaultValue="members">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="members" className="gap-1.5 flex-1 sm:flex-none">
            <Users2 className="w-3.5 h-3.5" /> {t('nav.users')}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="teams" className="gap-1.5 flex-1 sm:flex-none">
              <Shield className="w-3.5 h-3.5" /> {t('users.teams')}
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="groups" className="gap-1.5 flex-1 sm:flex-none">
              <Users2 className="w-3.5 h-3.5" /> {t('users.groupsTab')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 22 }}
            className="space-y-3"
          >
            {/* Search + filter + view toggle */}
            {!isLoading && (users?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                    <Input
                      placeholder={t('users.searchPlaceholder')}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-9 h-9 text-sm bg-muted/20"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(['all', 'admin', 'collaborator'] as const).map(r => (
                      <motion.button
                        key={r}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFilterRole(r)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                          filterRole === r
                            ? r === 'admin'
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : r === 'collaborator'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                : 'bg-muted text-foreground border-border'
                            : 'text-muted-foreground border-border/40 hover:border-border hover:text-foreground'
                        )}
                      >
                        {r === 'all' ? t('users.filterAll') : r === 'admin' ? 'Admin' : t('users.collaboratorLabel')}
                      </motion.button>
                    ))}

                    {/* View mode toggle */}
                    <div className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border/40 ml-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                        title="Grid view"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                        title="List view"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subrole filter chips */}
                <div className="flex flex-wrap gap-1.5">
                  {SUBROLE_OPTIONS.map(sr => (
                    <motion.button
                      key={sr}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterSubrole(filterSubrole === sr ? '' : sr)}
                      className={cn(
                        "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                        filterSubrole === sr
                          ? getSubroleClasses(sr)
                          : 'border-border/40 text-muted-foreground/60 hover:border-border hover:text-muted-foreground'
                      )}
                    >
                      {sr}
                    </motion.button>
                  ))}
                  {filterSubrole && (
                    <button
                      onClick={() => setFilterSubrole('')}
                      className="text-[11px] px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-1"
                    >
                      <X className="w-2.5 h-2.5" /> {t('users.clearFilter')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {isFiltering && !isLoading && (
              <p className="text-xs text-muted-foreground">
                {filteredUsers?.length ?? 0} {t('users.resultsFound')}
                {' · '}
                <button
                  onClick={() => { setSearch(''); setFilterRole('all'); setFilterSubrole(''); }}
                  className="text-primary hover:underline"
                >
                  {t('users.clearFilters')}
                </button>
              </p>
            )}

            {/* User list */}
            {isLoading ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
                </div>
              ) : (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)
              )
            ) : users?.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border border-dashed border-border/50 rounded-xl">
                <Users2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-sm">{t('users.noUsersYet')}</p>
              </div>
            ) : filteredUsers?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-xl">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-25" />
                <p className="font-medium text-sm">{t('users.noResults')}</p>
                <button
                  onClick={() => { setSearch(''); setFilterRole('all'); setFilterSubrole(''); }}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  {t('users.clearFilters')}
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <AnimatePresence initial={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredUsers?.map((user, i) => (
                    <UserCardGrid
                      key={user.id}
                      user={user as UserListUser}
                      index={i}
                      isAdmin={isAdmin}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </AnimatePresence>
            ) : (
              <AnimatePresence initial={false}>
                <div className="space-y-2">
                  {filteredUsers?.map((user, i) => (
                    <UserCardList
                      key={user.id}
                      user={user as UserListUser}
                      index={i}
                      isAdmin={isAdmin}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
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
                  onChange={e => setNewRobloxId(e.target.value.replace(/\D/g, '').slice(0, 20))}
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

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('users.discord')}
                  <span className="text-xs text-muted-foreground font-normal ml-1">{t('users.discordOptional')}</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <Input
                    placeholder={t('users.discordPlaceholder')}
                    value={newDiscord}
                    onChange={e => setNewDiscord(e.target.value.slice(0, 32))}
                    className="pl-9"
                  />
                </div>
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
                <label className="text-sm font-medium mb-2 block">{t('users.discord')}</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <Input
                    placeholder={t('users.discordPlaceholder')}
                    value={discordUsername}
                    onChange={e => setDiscordUsername(e.target.value.slice(0, 32))}
                    className="pl-9"
                  />
                </div>
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
                      className={cn(
                        "text-xs px-2 py-1 rounded-full border transition-colors",
                        subroles.includes(sr) ? getSubroleClasses(sr) : 'border-border/60 text-muted-foreground hover:border-primary/30'
                      )}>
                      {sr}
                    </motion.button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('users.customSubrole')}
                    value={customSubrole}
                    onChange={e => setCustomSubrole(e.target.value.slice(0, 50))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSubrole())}
                    className="h-8 text-sm"
                  />
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
                        className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-opacity hover:opacity-70", getSubroleClasses(sr))}>
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
                      className={cn(
                        "text-xs px-2 py-1 rounded-full border transition-colors",
                        groups.includes(g) ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'border-border/60 text-muted-foreground hover:border-blue-500/30'
                      )}>
                      {g}
                    </motion.button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('users.customGroup')}
                    value={customGroup}
                    onChange={e => setCustomGroup(e.target.value.slice(0, 50))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomGroup())}
                    className="h-8 text-sm"
                  />
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
