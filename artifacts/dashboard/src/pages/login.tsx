import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { Button } from '@/components/ui/button';
import { SiRoblox } from 'react-icons/si';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, Activity, LayoutDashboard, Shield, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  { icon: Activity, title: 'Real-time CCU tracking', desc: 'Monitor live concurrent users across all your experiences instantly.' },
  { icon: LayoutDashboard, title: 'Team Kanban boards', desc: "Organize your studio's tasks, milestones, and daily standups." },
  { icon: Shield, title: 'Roblox OAuth secured', desc: 'Enterprise-grade security using native Roblox authentication.' },
];

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  const params = new URLSearchParams(window.location.search);
  const authError = params.get('auth_error');
  const isUnauthorized = authError === 'unauthorized';
  const hasError = !!authError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-muted-foreground text-sm"
        >
          {t('common.loading')}
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated) return <Redirect to="/" />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col md:flex-row bg-background text-foreground overflow-hidden relative"
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px z-50 overflow-hidden">
        <motion.div
          className="h-full w-full bg-gradient-to-r from-transparent via-primary/70 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* LEFT PANEL */}
      <div className="relative w-full md:w-1/2 min-h-[45vh] md:min-h-screen border-b md:border-b-0 md:border-r border-border flex flex-col justify-between p-8 lg:p-14 overflow-hidden">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at center, hsl(38 92% 50%) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Ambient glow orbs */}
        <motion.div
          className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(38 92% 50% / 0.15) 0%, transparent 70%)' }}
          animate={{ y: [0, -24, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-[-10%] w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(38 92% 50% / 0.10) 0%, transparent 70%)' }}
          animate={{ y: [0, 20, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsl(38 92% 50%), hsl(38 80% 38%))',
              boxShadow: '0 0 20px hsl(38 92% 50% / 0.35)',
            }}
          >
            <Layers className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Ro<span className="text-primary">Check</span>
          </h1>
        </motion.div>

        {/* Tagline + features */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative z-10 mt-8 md:mt-0"
        >
          <p className="text-xl text-muted-foreground font-medium mb-10">Studio Operations Hub</p>
          <div className="space-y-6 max-w-sm">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className="flex items-start gap-4"
              >
                <div className="mt-0.5 p-2 rounded-lg bg-muted/30 border border-border/60 flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.15 }}
          className="w-full max-w-md"
        >
          <div
            className="relative rounded-2xl border p-8 md:p-10 overflow-hidden"
            style={{
              background: 'hsl(0 0% 7% / 0.8)',
              borderColor: 'hsl(0 0% 14%)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            {/* Card top shimmer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="flex flex-col items-center text-center mb-8">
              {/* Custom app icon — NOT the Roblox logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.3 }}
                className="mb-6 w-16 h-16 rounded-2xl flex items-center justify-center relative"
                style={{
                  background: 'hsl(38 92% 50% / 0.1)',
                  border: '1px solid hsl(38 92% 50% / 0.25)',
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{ border: '1px solid hsl(38 92% 50% / 0.3)' }}
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <Layers className="w-7 h-7 text-primary relative z-10" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <h2 className="text-2xl font-bold tracking-tight mb-1">{t('auth.loginTitle') || 'Welcome back'}</h2>
                <p className="text-sm text-muted-foreground">{t('auth.loginSubtitle')}</p>
              </motion.div>
            </div>

            <div className="space-y-4">
              {/* Error banner */}
              <AnimatePresence>
                {hasError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <div className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
                      isUnauthorized
                        ? 'bg-destructive/10 border-destructive/30 text-destructive'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}>
                      {isUnauthorized
                        ? <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      }
                      <span className="leading-snug">
                        {isUnauthorized ? t('auth.errorUnauthorized') : t('auth.errorGeneric')}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA button */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => window.location.href = '/api/auth/roblox'}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-3 font-semibold text-black relative overflow-hidden group text-base"
                  style={{
                    background: 'linear-gradient(to right, hsl(38 92% 50%), hsl(38 85% 60%))',
                    boxShadow: '0 0 24px hsl(38 92% 50% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.2)',
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 -translate-y-full group-hover:translate-y-full transition-transform duration-700 ease-in-out" />
                  <SiRoblox className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{t('auth.loginButton')}</span>
                </motion.button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 px-3 py-2.5 rounded-lg bg-black/30 border border-border/30"
              >
                <Shield className="w-3.5 h-3.5" />
                {t('auth.loginSecure')}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
