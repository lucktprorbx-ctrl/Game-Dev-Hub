import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-14 sm:h-16 border-b border-border bg-background flex items-center px-4 sm:px-6 sticky top-0 z-30">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden mr-2 h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1" />
    </header>
  );
}
