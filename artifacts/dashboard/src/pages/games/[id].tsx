import { useGetGame, useGetGameStats } from '@workspace/api-client-react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Coins, TrendingUp } from 'lucide-react';

export default function GameDetail() {
  const { id } = useParams();
  const gameId = parseInt(id || '0', 10);
  const { data: game } = useGetGame(gameId, { query: { enabled: !!gameId } });
  const { data: stats } = useGetGameStats(gameId, { query: { enabled: !!gameId } });
  const { t } = useTranslation();

  if (!game || !stats) return <div className="p-8">Loading...</div>;

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{game.name}</h1>
          <p className="text-muted-foreground">ID: {game.robloxGameId}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current CCU</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ccu.toLocaleString()}</div>
              {stats.peakCcu && <p className="text-xs text-muted-foreground mt-1">Peak: {stats.peakCcu.toLocaleString()}</p>}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Daily Revenue</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t('common.robux')}{stats.avgDailyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">~ {t('common.eur')}{stats.avgDailyRevenueEur.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Estimate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{t('common.robux')}{stats.monthlyEstimateRobux?.toLocaleString() || 0}</div>
              {stats.revenuePercentChange !== undefined && (
                <p className={`text-xs mt-1 ${stats.revenuePercentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.revenuePercentChange >= 0 ? '+' : ''}{stats.revenuePercentChange}% vs last month
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>CCU History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {stats.ccuHistory && stats.ccuHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.ccuHistory}>
                    <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                    <YAxis />
                    <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No history data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
