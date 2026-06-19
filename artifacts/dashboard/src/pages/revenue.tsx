import { useGetRevenueTracker } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageTransition } from '@/components/ui/page-transition';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

export default function Revenue() {
  const { data: entries, isLoading } = useGetRevenueTracker();
  const { t } = useTranslation();

  return (
    <PageTransition>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.revenue')}</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead>Revenue %</TableHead>
                <TableHead className="text-right">Monthly Est. (Robux)</TableHead>
                <TableHead className="text-right">Monthly Est. (EUR)</TableHead>
                <TableHead className="text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">{t('common.loading')}</TableCell></TableRow>
              ) : entries?.map(entry => (
                <TableRow key={entry.gameId}>
                  <TableCell className="font-medium">{entry.gameName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${entry.revenuePercentage}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{entry.revenuePercentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{t('common.robux')}{entry.monthlyEstimateRobux.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{t('common.eur')}{entry.monthlyEstimateEur.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={entry.trend >= 0 ? 'default' : 'destructive'} className={entry.trend >= 0 ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/20' : ''}>
                      {entry.trend >= 0 ? '+' : ''}{entry.trend}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
