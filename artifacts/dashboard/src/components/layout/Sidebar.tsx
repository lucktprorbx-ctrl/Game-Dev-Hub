import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Gamepad2, 
  TrendingUp, 
  CalendarDays, 
  Users,
  LogOut
} from 'lucide-react';
import { useLogout } from '@workspace/api-client-react';
import { Button } from 'react-day-picker';

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const logout = useLogout();

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: t('nav.dashboard'), adminOnly: true },
    { href: '/games', icon: Gamepad2, label: t('nav.games'), adminOnly: true },
    { href: '/revenue', icon: TrendingUp, label: t('nav.revenue'), adminOnly: true },
    { href: '/planning', icon: CalendarDays, label: t('nav.planning'), adminOnly: false },
    { href: '/users', icon: Users, label: t('nav.users'), adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    await logout.mutateAsync(undefined);
    window.location.href = '/login';
  };

  return (
    <div className="w-64 border-r border-border bg-sidebar h-screen flex flex-col fixed left-0 top-0 text-sidebar-foreground">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <h1 className="font-bold text-xl tracking-tight text-sidebar-primary">RoVerse<span className="text-sidebar-foreground">FR</span></h1>
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

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          {user?.robloxAvatarUrl ? (
            <img src={user.robloxAvatarUrl} alt="" className="w-8 h-8 rounded-full bg-muted" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold">
              {user?.robloxUsername?.charAt(0) || 'U'}
            </div>
          )}
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium truncate">{user?.robloxDisplayName || user?.robloxUsername}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.role}</span>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  );
}
