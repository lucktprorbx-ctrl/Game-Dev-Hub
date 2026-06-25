import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users,
  LogOut,
  Gamepad2,
  Shield,
  Users2,
  X,
  FileText,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { useLogout } from '@workspace/api-client-react';
import { getSubroleClasses, getSubroleDot } from '@/lib/role-colors';
import { motion } from 'framer-motion';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const logout = useLogout();

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: t('nav.dashboard'), adminOnly: true },
    { href: '/games', icon: Gamepad2, label: t('nav.games'), adminOnly: false },
    { href: '/planning', icon: CalendarDays, label: t('nav.planning'), adminOnly: false },
    { href: '/users', icon: Users, label: t('nav.users'), adminOnly: true },
    { href: '/settings', icon: Settings, label: t('nav.settings'), adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    await logout.mutateAsync(undefined);
    window.location.href = '/login';
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const primarySubrole = user?.subroles?.[0];
  const extraSubroles = (user?.subroles?.length ?? 0) - 1;

  return (
    <>
      <div className={cn(
        "fixed left-0 top-0 h-screen w-64 border-r border-border bg-sidebar flex flex-col z-50 text-sidebar-foreground transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo + mobile close */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="h-14 sm:h-16 flex items-center px-5 border-b border-sidebar-border flex-shrink-0"
        >
          <h1 className="font-bold text-xl tracking-tight text-sidebar-primary flex-1">
            Ro<span className="text-sidebar-foreground">Check</span>
          </h1>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4 sm:py-5 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {visibleItems.map((item, i) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 + 0.1, duration: 0.3, ease: 'easeOut' }}
              >
                <Link href={item.href} onClick={handleNavClick}>
                  <motion.div
                    whileHover={{ x: isActive ? 0 : 2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer select-none",
                      isActive
                        ? "text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-muted/20"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-sidebar-accent rounded-lg"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <motion.span
                      className="relative z-10"
                      animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <item.icon className="h-4 w-4" />
                    </motion.span>
                    <span className="relative z-10 flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-3 h-3 relative z-10 opacity-50" />}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="p-3 border-t border-sidebar-border space-y-1 flex-shrink-0"
        >
          {/* User profile card */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-sidebar-accent/40 border border-sidebar-border/50 mb-2">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user?.robloxAvatarUrl ? (
                <motion.img
                  src={user.robloxAvatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-xl bg-muted ring-2 ring-sidebar-border object-cover"
                  whileHover={{ scale: 1.06 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold text-sm ring-2 ring-sidebar-border">
                  {user?.robloxUsername?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar",
                  isAdmin ? 'bg-red-400' : (primarySubrole ? getSubroleDot(primarySubrole) : 'bg-blue-400')
                )}
              />
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate leading-tight">
                {user?.robloxDisplayName || user?.robloxUsername}
              </div>
              {user?.robloxDisplayName && (
                <div className="text-[10px] text-muted-foreground/60 truncate">@{user.robloxUsername}</div>
              )}
              <div className="flex items-center gap-1 mt-0.5">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-400 uppercase tracking-wide">
                    <Shield className="w-2.5 h-2.5" /> {t('sidebar.admin')}
                  </span>
                ) : primarySubrole ? (
                  <span className={cn(
                    "inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold",
                    getSubroleClasses(primarySubrole)
                  )}>
                    {primarySubrole}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-400 uppercase tracking-wide">
                    <Users2 className="w-2.5 h-2.5" /> {t('sidebar.collaborator')}
                  </span>
                )}
                {!isAdmin && extraSubroles > 0 && (
                  <span className="text-[10px] text-muted-foreground/50">+{extraSubroles}</span>
                )}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('nav.logout')}
          </motion.button>

          {/* Privacy policy link */}
          <Link href="/privacy" onClick={handleNavClick}>
            <motion.span
              whileHover={{ x: 2 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              {t('nav.privacy')}
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </>
  );
}
