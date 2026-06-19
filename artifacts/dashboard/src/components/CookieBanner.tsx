import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none"
        >
          <div className="max-w-screen-xl mx-auto flex items-center justify-between p-4 bg-card border border-border shadow-2xl rounded-lg pointer-events-auto">
            <p className="text-sm text-card-foreground">
              {t('cookie.message')}
            </p>
            <div className="flex items-center gap-2 ml-4">
              <Button size="sm" onClick={handleAccept} className="whitespace-nowrap">
                {t('cookie.accept')}
              </Button>
              <Button size="icon" variant="ghost" onClick={handleAccept} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
