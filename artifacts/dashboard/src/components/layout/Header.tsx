import { LanguageToggle } from '@/components/ui/language-toggle';

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-end px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <LanguageToggle />
      </div>
    </header>
  );
}
