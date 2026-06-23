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
} from 'lucide-react';
import { useLogout } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { getSubroleClasses, getSubroleDot } from '@/lib/role-colors';
import { motion } from 'framer-motion';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const logout = useLogout();

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: t('nav.dashboard'), adminOnly: true },
    { href: '/games', icon: Gamepad2, label: t('nav.games'), adminOnly: false },
    { href: '/planning', icon: CalendarDays, label: t('nav.planning'), adminOnly: false },
    { href: '/users', icon: Users, label: t('nav.users'), adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    await logout.mutateAsync(undefined);
    window.location.href = '/login';
  };

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const primarySubrole = user?.subroles?.[0];
  const extraSubroles = (user?.subroles?.length ?? 0) - 1;

  return (
    <>
      {/* Sidebar panel */}
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
          className="h-14 sm:h-16 flex items-center px-6 border-b border-sidebar-border flex-shrink-0"
        >
          <h1 className="font-bold text-xl tracking-tight text-sidebar-primary flex-1">
            Ro<span className="text-sidebar-foreground">Check</span>
          </h1>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
        
        <nav className="flex-1 py-4 sm:py-6 px-4 flex flex-col gap-0.5 overflow-y-auto">
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
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer select-none",
                      isActive
                        ? "text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:text-sidebar-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-sidebar-accent rounded-md"
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
                    <span className="relative z-10">{item.label}</span>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom user card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="p-4 border-t border-sidebar-border space-y-2 flex-shrink-0"
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user?.robloxAvatarUrl ? (
                <motion.img
                  src={user.robloxAvatarUrl}
                  alt=""
                  className="w-9 h-9 rounded-full bg-muted ring-2 ring-sidebar-border"
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold text-sm ring-2 ring-sidebar-border">
                  {user?.robloxUsername?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              {/* Role dot indicator */}
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar",
                  isAdmin ? 'bg-red-400' : (primarySubrole ? getSubroleDot(primarySubrole) : 'bg-blue-400')
                )}
              />
            </div>

            {/* Name + role info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate leading-tight">
                {user?.robloxDisplayName || user?.robloxUsername}
              </div>
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
              </div>
              {!isAdmin && extraSubroles > 0 && (
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {t('sidebar.othersSubroles', { count: extraSubroles })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Language toggle */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={toggleLang}
            className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-sidebar-accent/30 transition-colors"
          >
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors", i18n.language === 'en' ? 'bg-primary/20 text-primary' : 'text-muted-foreground/60')}>EN</span>
            <span className="text-muted-foreground/40">/</span>
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors", i18n.language === 'fr' ? 'bg-primary/20 text-primary' : 'text-muted-foreground/60')}>FR</span>
          </motion.button>

          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground text-xs h-8" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5 mr-2" />
            {t('nav.logout')}
          </Button>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <Link href="/privacy">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer">
                <FileText className="w-2.5 h-2.5" />
                Politique de confidentialité
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
