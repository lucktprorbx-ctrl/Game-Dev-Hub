import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  TrendingUp, 
  CalendarDays, 
  Users,
  LogOut,
  Gamepad2,
  Shield,
  Users2,
} from 'lucide-react';
import { useLogout } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { getSubroleClasses, getSubroleDot } from '@/lib/role-colors';

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const logout = useLogout();

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: t('nav.dashboard'), adminOnly: true },
    { href: '/games', icon: Gamepad2, label: t('nav.games'), adminOnly: false },
    { href: '/revenue', icon: TrendingUp, label: t('nav.revenue'), adminOnly: true },
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

  const primarySubrole = user?.subroles?.[0];
  const isAdmin2 = user?.role === 'admin';

  return (
    <div className="w-64 border-r border-border bg-sidebar h-screen flex flex-col fixed left-0 top-0 text-sidebar-foreground">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <h1 className="font-bold text-xl tracking-tight text-sidebar-primary">Ro<span className="text-sidebar-foreground">Check</span></h1>
      </div>
      
      <div className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Bottom user card — improved */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user?.robloxAvatarUrl ? (
              <img src={user.robloxAvatarUrl} alt="" className="w-9 h-9 rounded-full bg-muted ring-2 ring-sidebar-border" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold text-sm ring-2 ring-sidebar-border">
                {user?.robloxUsername?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            {/* Role dot indicator */}
            <span className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar",
              isAdmin2 ? 'bg-red-400' : (primarySubrole ? getSubroleDot(primarySubrole) : 'bg-blue-400')
            )} />
          </div>

          {/* Name + role info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate leading-tight">
              {user?.robloxDisplayName || user?.robloxUsername}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {isAdmin2 ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-400 uppercase tracking-wide">
                  <Shield className="w-2.5 h-2.5" /> Admin
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
                  <Users2 className="w-2.5 h-2.5" /> Collaborateur
                </span>
              )}
            </div>
            {/* Extra subroles count */}
            {!isAdmin2 && (user?.subroles?.length ?? 0) > 1 && (
              <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                +{(user?.subroles?.length ?? 0) - 1} {t('common.more', { count: (user?.subroles?.length ?? 0) - 1 }).replace('+{{count}} more', '').trim() || 'autre(s)'}
              </div>
            )}
          </div>
        </div>

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-sidebar-accent/30 transition-colors"
        >
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors", i18n.language === 'en' ? 'bg-primary/20 text-primary' : 'text-muted-foreground/60')}>EN</span>
          <span className="text-muted-foreground/40">/</span>
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors", i18n.language === 'fr' ? 'bg-primary/20 text-primary' : 'text-muted-foreground/60')}>FR</span>
        </button>

        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground text-xs h-8" onClick={handleLogout}>
          <LogOut className="h-3.5 w-3.5 mr-2" />
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  );
}
