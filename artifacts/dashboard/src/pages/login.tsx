import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <PageTransition className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <Card className="w-[400px] border-border bg-card/50 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <Gamepad2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">RoVerse<span className="text-primary">FR</span></CardTitle>
          <CardDescription className="text-base mt-2">
            Studio Operations Hub
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <Button 
            className="w-full h-12 text-base font-medium" 
            onClick={() => window.location.href = '/api/auth/roblox'}
          >
            Continue with Roblox
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-6">
            Secure authentication via official Roblox OAuth2
          </p>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
