import { Switch, Route, Redirect } from "wouter";
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import Games from '@/pages/games';
import GameDetail from '@/pages/games/[id]';
import Users from '@/pages/users';
import Planning from '@/pages/planning';
import Privacy from '@/pages/privacy';
import Terms from '@/pages/terms';
import MaintenancePage from '@/pages/maintenance';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';

function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { data: maintenance } = useMaintenanceMode();

  if (isLoading) return <div className="p-8">Loading...</div>;

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Redirect to="/planning" />;
  }

  if (maintenance?.maintenanceMode && user?.role !== 'admin') {
    return <MaintenancePage message={maintenance.message} />;
  }

  return (
    <MainLayout>
      <Component {...rest} />
    </MainLayout>
  );
}

export function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />

      {/* Protected Admin Routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} adminOnly />
      </Route>
      <Route path="/games">
        <ProtectedRoute component={Games} adminOnly />
      </Route>
      <Route path="/games/:id">
        {params => <ProtectedRoute component={GameDetail} adminOnly params={params} />}
      </Route>
      <Route path="/users">
        <ProtectedRoute component={Users} adminOnly />
      </Route>

      {/* Protected Collaborator Routes */}
      <Route path="/planning">
        <ProtectedRoute component={Planning} />
      </Route>

      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}
