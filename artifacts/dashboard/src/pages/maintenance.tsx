import { motion } from 'framer-motion';
import { Wrench, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MaintenancePage({ message }: { message?: string | null }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="max-w-md w-full text-center space-y-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      >
        {/* Animated icon */}
        <motion.div
          className="mx-auto w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
          animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Wrench className="w-9 h-9 text-amber-400" />
        </motion.div>

        {/* Brand */}
        <div>
          <span className="text-2xl font-black tracking-tight">
            <span className="text-amber-400">Ro</span>
            <span className="text-white">Check</span>
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t('maintenance.title')}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {message || t('maintenance.defaultMessage')}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 w-24 mx-auto" />

        {/* Status row */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          {t('maintenance.workInProgress')}
        </div>

        {/* ETA */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <Clock className="w-3.5 h-3.5" />
          {t('maintenance.backSoon')}
        </div>
      </motion.div>
    </div>
  );
}
