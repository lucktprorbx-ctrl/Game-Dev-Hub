import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Cookie, X, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent) return;
    const timer = setTimeout(() => setIsVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[100]"
        >
          <div className="bg-card border border-border/80 shadow-2xl shadow-black/40 rounded-2xl p-4 backdrop-blur-sm overflow-hidden relative">
            {/* Shimmer top border */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cookie className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-0.5">
                  {isFr ? 'Politique de cookies' : 'Cookie Policy'}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('cookie.message')}
                </p>
              </div>
              <button
                onClick={handleAccept}
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors flex-shrink-0 mt-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAccept} className="flex-1 h-8 text-xs">
                {t('cookie.accept')}
              </Button>
              <Link href="/privacy">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50">
                  <ExternalLink className="w-3 h-3" />
                  {isFr ? 'En savoir plus' : 'Learn more'}
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
