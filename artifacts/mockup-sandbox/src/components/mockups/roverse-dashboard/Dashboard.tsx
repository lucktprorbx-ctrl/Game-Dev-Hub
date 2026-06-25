import React from 'react';
import { 
  Users, DollarSign, Server, Activity, 
  Calendar, Settings, Gamepad2, Users2,
  ChevronRight, ArrowUpRight, BarChart3,
  Globe2, Sparkles, Box, LayoutDashboard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Dashboard() {
  const theme = {
    bg: 'hsl(0 0% 4%)',
    card: 'hsl(0 0% 7%)',
    primary: 'hsl(38 92% 50%)',
    border: 'hsl(0 0% 12%)',
    muted: 'hsl(0 0% 65%)',
    text: 'hsl(0 0% 90%)'
  };

  const stats = [
    { label: "Total Players", value: "12.4M", change: "+14.2%", icon: Users, isPositive: true },
    { label: "Monthly Revenue", value: "R$ 4.2M", change: "+5.4%", icon: DollarSign, isPositive: true },
    { label: "Active Servers", value: "342", change: "-2.1%", icon: Server, isPositive: false },
    { label: "Uptime", value: "99.98%", change: "+0.01%", icon: Activity, isPositive: true },
  ];

  const games = [
    { 
      name: "Neon Velocity", 
      genre: "Racing", 
      players: "4.2K", 
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000&auto=format&fit=crop",
      revenue: "R$ 1.2M",
      status: "Live"
    },
    { 
      name: "Shadow Realm", 
      genre: "RPG", 
      players: "12.5K", 
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2000&auto=format&fit=crop",
      revenue: "R$ 2.8M",
      status: "Live"
    },
    { 
      name: "Cyber City 2077", 
      genre: "Open World", 
      players: "N/A", 
      image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=2000&auto=format&fit=crop",
      revenue: "N/A",
      status: "In Development"
    }
  ];

  const team = [
    { name: "Alex Chen", role: "Lead Dev", initials: "AC", avatar: "https://i.pravatar.cc/150?u=alex" },
    { name: "Sarah Jenkins", role: "Art Director", initials: "SJ", avatar: "https://i.pravatar.cc/150?u=sarah" },
    { name: "Marcus Torres", role: "Game Designer", initials: "MT", avatar: "https://i.pravatar.cc/150?u=marcus" },
    { name: "Emily Wong", role: "Community Mgr", initials: "EW", avatar: "https://i.pravatar.cc/150?u=emily" },
    { name: "David Kim", role: "Backend Eng", initials: "DK", avatar: "https://i.pravatar.cc/150?u=david" },
  ];

  return (
    <div className="min-h-screen flex font-sans selection:bg-[hsl(38_92%_50%_/_0.3)]" style={{ background: theme.bg, color: theme.text }}>
      {/* Sidebar Placeholder */}
      <aside className="w-64 fixed left-0 top-0 bottom-0 border-r flex flex-col z-20" style={{ borderColor: theme.border, background: theme.card }}>
        <div className="h-16 flex items-center px-6 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[hsl(38_92%_50%)] to-orange-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Box className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight">RoVerse</span>
          </div>
        </div>
        <div className="p-4 flex-1">
          <div className="space-y-1">
            <div className="px-3 py-2 rounded-md flex items-center gap-3 text-sm font-medium" style={{ background: 'hsl(38 92% 50% / 0.1)', color: theme.primary }}>
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </div>
            <div className="px-3 py-2 rounded-md flex items-center gap-3 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer" style={{ color: theme.muted }}>
              <Gamepad2 className="w-4 h-4" /> Games
            </div>
            <div className="px-3 py-2 rounded-md flex items-center gap-3 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer" style={{ color: theme.muted }}>
              <Users2 className="w-4 h-4" /> Team
            </div>
            <div className="px-3 py-2 rounded-md flex items-center gap-3 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer" style={{ color: theme.muted }}>
              <Calendar className="w-4 h-4" /> Planning
            </div>
            <div className="px-3 py-2 rounded-md flex items-center gap-3 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer" style={{ color: theme.muted }}>
              <BarChart3 className="w-4 h-4" /> Analytics
            </div>
          </div>
        </div>
        <div className="p-4 border-t" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border border-white/10">
              <AvatarImage src="https://i.pravatar.cc/150?u=admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Admin User</span>
              <span className="text-xs" style={{ color: theme.muted }}>Studio Head</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 relative overflow-hidden flex flex-col">
        {/* Glow Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[100px]" style={{ background: theme.primary }} />
          <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.03] blur-[100px]" style={{ background: theme.primary }} />
        </div>

        <ScrollArea className="flex-1 h-full">
          <div className="p-8 max-w-7xl mx-auto space-y-10 pb-20 relative z-10">
            
            {/* Hero Section */}
            <section className="relative">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2" style={{ color: theme.primary }}>
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium tracking-wider uppercase">Studio Operations</span>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back, Admin.</h1>
                  <p className="text-lg" style={{ color: theme.muted }}>Your studio is running smoothly. Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="bg-transparent border-white/10 hover:bg-white/5 text-white">
                    <Globe2 className="w-4 h-4 mr-2" />
                    View Live Site
                  </Button>
                </div>
              </div>
              
              {/* Divider with fade */}
              <div className="h-px w-full bg-gradient-to-r from-[hsl(0_0%_20%)] via-[hsl(0_0%_10%)] to-transparent" />
            </section>

            {/* Quick Actions */}
            <section>
              <div className="flex gap-4">
                {[
                  { icon: Calendar, label: "Planning", desc: "Manage sprints" },
                  { icon: Users2, label: "Manage Team", desc: "Access control" },
                  { icon: Gamepad2, label: "New Game", desc: "Create project" },
                  { icon: Settings, label: "Settings", desc: "Studio config" }
                ].map((action, i) => (
                  <button 
                    key={i}
                    className="flex-1 flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:-translate-y-1 hover:shadow-lg group"
                    style={{ background: theme.card, borderColor: theme.border }}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors group-hover:bg-[hsl(38_92%_50%_/_0.2)]" style={{ background: 'hsl(0 0% 10%)' }}>
                      <action.icon className="w-5 h-5 transition-colors group-hover:text-[hsl(38_92%_50%)]" style={{ color: theme.muted }} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{action.label}</div>
                      <div className="text-xs" style={{ color: theme.muted }}>{action.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <Card key={i} className="relative overflow-hidden group border-none" style={{ background: theme.card }}>
                  {/* Glowing bottom border */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[hsl(38_92%_50%)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative" style={{ background: 'hsl(0 0% 12%)' }}>
                        {/* Icon glow */}
                        <div className="absolute inset-0 rounded-lg blur-md opacity-20" style={{ background: theme.primary }} />
                        <stat.icon className="w-5 h-5 relative z-10" style={{ color: theme.primary }} />
                      </div>
                      <Badge variant="outline" className={`border-none ${stat.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {stat.change}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: theme.muted }}>{stat.label}</div>
                      <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>

            {/* Main Grid: Games & Team */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Active Games */}
              <section className="col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5" style={{ color: theme.primary }} />
                    Active Projects
                  </h2>
                  <Button variant="link" className="text-sm px-0" style={{ color: theme.muted }}>
                    View all <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {games.map((game, i) => (
                    <Card key={i} className="border-none overflow-hidden group cursor-pointer" style={{ background: theme.card }}>
                      <div className="relative h-40 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10 opacity-80" />
                        <img 
                          src={game.image} 
                          alt={game.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-3 right-3 z-20">
                          <Badge className="bg-black/50 backdrop-blur-md text-white hover:bg-black/50 border-white/10">
                            {game.status}
                          </Badge>
                        </div>
                        <div className="absolute bottom-3 left-4 z-20">
                          <h3 className="text-lg font-bold text-white mb-1">{game.name}</h3>
                          <span className="text-xs font-medium px-2 py-1 rounded bg-white/10 backdrop-blur-md text-white/90">
                            {game.genre}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex flex-col">
                            <span style={{ color: theme.muted }}>Players</span>
                            <span className="font-semibold">{game.players}</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span style={{ color: theme.muted }}>Revenue</span>
                            <span className="font-semibold" style={{ color: theme.primary }}>{game.revenue}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Team Members */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" style={{ color: theme.primary }} />
                    Team
                  </h2>
                </div>
                
                <Card className="border-none p-6" style={{ background: theme.card }}>
                  <div className="space-y-6">
                    {team.map((member, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Avatar className="border border-white/10 transition-transform group-hover:scale-105">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback style={{ background: 'hsl(0 0% 12%)' }}>{member.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-semibold">{member.name}</div>
                            <div className="text-xs" style={{ color: theme.muted }}>{member.role}</div>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full hover:bg-white/5">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-6 bg-white/5 hover:bg-white/10 text-white border-none shadow-none">
                    Invite Member
                  </Button>
                </Card>
              </section>
            </div>

          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
