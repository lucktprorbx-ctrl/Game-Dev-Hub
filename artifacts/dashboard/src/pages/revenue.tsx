import { PageTransition } from '@/components/ui/page-transition';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function Revenue() {
  const { t } = useTranslation();

  return (
    <PageTransition>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.revenue')}</h1>
      </div>

      <Card className="border-dashed">
        <CardContent className="py-20 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Revenue Tracker</h2>
            <p className="text-muted-foreground text-sm max-w-md">
              Roblox doesn't currently provide a public real-time revenue API.
              This section will display earnings, splits, and monthly estimates once the Roblox Open Cloud API supports it.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border/50 rounded-lg px-4 py-3 mt-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
            <span>Tracking coming soon · Roblox Open Cloud roadmap</span>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
