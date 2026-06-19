import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CookieBanner } from '@/components/CookieBanner';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <CookieBanner />
    </div>
  );
}
