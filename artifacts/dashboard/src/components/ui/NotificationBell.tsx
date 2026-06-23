import { useState, useEffect, useRef } from 'react';
import { Bell, Users, Columns2, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, forceUpdate] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    window.addEventListener('rocheck:notifications:read', handler);
    return () => window.removeEventListener('rocheck:notifications:read', handler);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && unreadCount > 0) {
      setTimeout(markAllRead, 1500);
    }
  };

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
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">Notifications</span>
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
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
                  <p className="text-sm font-medium text-muted-foreground">All caught up</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">No new activity in the last 7 days</p>
                </div>
              ) : (
                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                >
                  {notifications.map((n) => (
                    <motion.li
                      key={n.id}
                      variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                      className="flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {/* Icon / Avatar */}
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

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{n.message}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{n.detail}</span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-xs text-muted-foreground/60">{timeAgo(n.timestamp)}</span>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
