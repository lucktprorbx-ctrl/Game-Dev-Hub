import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

function LangToggle() {
  const { i18n } = useTranslation();
  const current = i18n.language === 'fr' ? 'fr' : 'en';

  const toggle = (lang: 'en' | 'fr') => {
    if (lang !== current) i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5 border border-border/40">
      {(['en', 'fr'] as const).map((lang) => (
        <motion.button
          key={lang}
          onClick={() => toggle(lang)}
          whileTap={{ scale: 0.93 }}
          className={cn(
            "relative px-2.5 py-1 rounded-md text-xs font-semibold transition-colors duration-150 select-none",
            current === lang
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {current === lang && (
            <motion.span
              layoutId="lang-pill"
              className="absolute inset-0 bg-background rounded-md shadow-sm border border-border/50"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10 uppercase">{lang}</span>
        </motion.button>
      ))}
    </div>
  );
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-14 sm:h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 sm:px-6 sticky top-0 z-30 gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <LangToggle />
      <NotificationBell />
    </header>
  );
}
