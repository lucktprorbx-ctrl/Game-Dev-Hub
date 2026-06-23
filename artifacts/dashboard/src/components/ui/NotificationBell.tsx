import { useState, useEffect, useRef } from 'react';
import { Bell, Users, Columns2, CheckCheck, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

function timeAgo(date: Date, lang: string): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (lang === 'fr') {
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)}j`;
  }
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationBell() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('rocheck:notif:read');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, markAllRead } = useNotifications();

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      const newReadIds = new Set([...readIds, ...notifications.map(n => n.id)]);
      setReadIds(newReadIds);
      localStorage.setItem('rocheck:notif:read', JSON.stringify([...newReadIds]));
      markAllRead();
    }
  };

  const lang = i18n.language === 'fr' ? 'fr' : 'en';
  const title = lang === 'fr' ? 'Notifications' : 'Notifications';
  const markAllReadLabel = lang === 'fr' ? 'Tout marquer lu' : 'Mark all read';
  const allCaughtUp = lang === 'fr' ? 'Tout à jour' : 'All caught up';
  const noActivity = lang === 'fr' ? 'Aucune activité récente' : 'No recent activity';

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
        className={cn(
          "relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
          open ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        )}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl shadow-black/20 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">{title}</span>
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    const newReadIds = new Set([...readIds, ...notifications.map(n => n.id)]);
                    setReadIds(newReadIds);
                    localStorage.setItem('rocheck:notif:read', JSON.stringify([...newReadIds]));
                    markAllRead();
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  {markAllReadLabel}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center mb-3"
                  >
                    <Bell className="w-4 h-4 text-muted-foreground/50" />
                  </motion.div>
                  <p className="text-sm font-medium text-muted-foreground">{allCaughtUp}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{noActivity}</p>
                </div>
              ) : (
                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                >
                  {notifications.map((n) => {
                    const isRead = readIds.has(n.id);
                    return (
                      <motion.li
                        key={n.id}
                        variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors relative",
                          !isRead && "bg-primary/[0.03]"
                        )}
                      >
                        {!isRead && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2">
                            <Circle className="w-1.5 h-1.5 fill-primary text-primary" />
                          </div>
                        )}
                        <div className="flex-shrink-0 mt-0.5">
                          {n.type === 'new_member' && n.avatarUrl ? (
                            <img src={n.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-muted ring-1 ring-border/50" />
                          ) : (
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              n.type === 'new_member' ? 'bg-blue-500/15' : 'bg-indigo-500/15'
                            )}>
                              {n.type === 'new_member'
                                ? <Users className="w-3.5 h-3.5 text-blue-400" />
                                : <Columns2 className="w-3.5 h-3.5 text-indigo-400" />
                              }
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm leading-snug", !isRead ? "font-semibold" : "font-medium")}>{n.message}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{n.detail}</span>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-xs text-muted-foreground/60">{timeAgo(n.timestamp, lang)}</span>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
