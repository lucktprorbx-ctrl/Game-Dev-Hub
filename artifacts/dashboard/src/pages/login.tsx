import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { Button } from '@/components/ui/button';
import { SiRoblox } from 'react-icons/si';
import { motion } from 'framer-motion';

const orbs = [
  { size: 400, x: -10, y: 20, delay: 0, duration: 12, color: 'from-primary/8 to-primary/3' },
  { size: 300, x: 60, y: 60, delay: 2, duration: 15, color: 'from-amber-500/6 to-transparent' },
  { size: 250, x: 20, y: 70, delay: 4, duration: 10, color: 'from-primary/5 to-transparent' },
];

function FloatingOrb({ orb }: { orb: typeof orbs[0] }) {
  return (
    <motion.div
      className={`absolute rounded-full bg-gradient-radial ${orb.color} blur-3xl pointer-events-none`}
      style={{ width: orb.size, height: orb.size, left: `${orb.x}%`, top: `${orb.y}%` }}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -25, 15, 0],
        scale: [1, 1.08, 0.95, 1],
        opacity: [0.6, 0.9, 0.7, 0.6],
      }}
      transition={{
        duration: orb.duration,
        delay: orb.delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-muted-foreground text-sm"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden"
    >
      {/* Floating orbs */}
      {orbs.map((orb, i) => <FloatingOrb key={i} orb={orb} />)}

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
        className="w-[400px] bg-card/60 backdrop-blur-2xl border border-border/60 rounded-2xl shadow-2xl shadow-black/40 relative z-10 overflow-hidden"
      >
        {/* Top shimmer line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="text-center pb-8 pt-10 px-8">
          {/* Logo icon — spring bounce entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.25 }}
            className="mx-auto w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-6 relative"
          >
            {/* Pulsing ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl border border-primary/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <SiRoblox className="w-8 h-8 text-primary" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold tracking-tight">
              Ro<span className="text-primary">Check</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Studio operations hub
            </p>
          </motion.div>
        </div>

        <div className="pb-10 px-8 space-y-4">
          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                className="w-full h-12 text-base font-medium relative overflow-hidden group"
                onClick={() => window.location.href = '/api/auth/roblox'}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full"
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
                <SiRoblox className="w-4 h-4 mr-2" />
                Continue with Roblox
              </Button>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-xs text-center text-muted-foreground"
          >
            Secure authentication via official Roblox OAuth2
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}
