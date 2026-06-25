import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { SiRoblox } from 'react-icons/si';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, Shield, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  const params = new URLSearchParams(window.location.search);
  const authError = params.get('auth_error');
  const isUnauthorized = authError === 'unauthorized';
  const hasError = !!authError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(0 0% 4%)' }}>
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
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden relative"
      style={{ background: 'hsl(0 0% 4%)' }}
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px z-50 overflow-hidden">
        <motion.div
          className="h-full w-full"
          style={{ background: 'linear-gradient(90deg, transparent, hsl(38 92% 50% / 0.7), transparent)' }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Ambient glow orbs — cover the whole page */}
      <motion.div
        className="absolute pointer-events-none rounded-full blur-[130px]"
        style={{
          width: 600,
          height: 600,
          top: '-10%',
          right: '-10%',
          background: 'radial-gradient(circle, hsl(38 92% 50% / 0.13) 0%, transparent 70%)',
        }}
        animate={{ y: [0, -30, 0], scale: [1, 1.07, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute pointer-events-none rounded-full blur-[100px]"
        style={{
          width: 450,
          height: 450,
          bottom: '-5%',
          left: '-8%',
          background: 'radial-gradient(circle, hsl(38 92% 50% / 0.09) 0%, transparent 70%)',
        }}
        animate={{ y: [0, 24, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="absolute pointer-events-none rounded-full blur-[80px]"
        style={{
          width: 300,
          height: 300,
          top: '50%',
          left: '30%',
          background: 'radial-gradient(circle, hsl(38 92% 50% / 0.05) 0%, transparent 70%)',
        }}
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />

      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at center, hsl(38 92% 50%) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div
          className="relative rounded-2xl border p-8 md:p-10 overflow-hidden"
          style={{
            background: 'hsl(0 0% 7% / 0.85)',
            borderColor: 'hsl(0 0% 14%)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), 0 0 0 1px hsl(0 0% 14%) inset',
          }}
        >
          {/* Card top shimmer accent */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(38 92% 50% / 0.55), transparent)' }}
          />

          <div className="flex flex-col items-center text-center mb-8">
            {/* Brand icon — custom, not Roblox logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
              className="mb-6 w-16 h-16 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'hsl(38 92% 50% / 0.1)',
                border: '1px solid hsl(38 92% 50% / 0.25)',
              }}
            >
              {/* Pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ border: '1px solid hsl(38 92% 50% / 0.35)' }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Layers className="w-7 h-7 relative z-10" style={{ color: 'hsl(38 92% 50%)' }} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold tracking-tight mb-1 text-white">{t('auth.loginTitle') || 'Welcome back'}</h2>
              <p className="text-sm" style={{ color: 'hsl(0 0% 55%)' }}>{t('auth.loginSubtitle')}</p>
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
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.location.href = '/api/auth/roblox'}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-3 font-semibold text-black relative overflow-hidden group text-base"
                style={{
                  background: 'linear-gradient(to right, hsl(38 92% 50%), hsl(38 85% 62%))',
                  boxShadow: '0 0 28px hsl(38 92% 50% / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.2)',
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
              transition={{ delay: 0.45 }}
              className="flex items-center justify-center gap-2 text-xs px-3 py-2.5 rounded-lg border"
              style={{
                background: 'hsl(0 0% 6%)',
                borderColor: 'hsl(0 0% 12%)',
                color: 'hsl(0 0% 40%)',
              }}
            >
              <Shield className="w-3.5 h-3.5" />
              {t('auth.loginSecure')}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
