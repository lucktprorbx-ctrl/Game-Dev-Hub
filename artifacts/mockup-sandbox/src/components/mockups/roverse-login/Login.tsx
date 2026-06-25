import React from "react";
import { SiRoblox } from "react-icons/si";
import { CheckCircle2, LayoutDashboard, Shield, Activity } from "lucide-react";

export function Login() {
  const styles = {
    "--bg": "0 0% 4%",
    "--card": "0 0% 7%",
    "--primary": "38 92% 50%",
    "--border": "0 0% 12%",
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen w-full flex flex-col md:flex-row relative overflow-hidden font-sans text-white" 
      style={{ backgroundColor: "hsl(var(--bg))", ...styles }}
    >
      {/* Top Shimmer Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] w-full z-50 overflow-hidden">
        <div 
          className="w-full h-full"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.8), transparent)",
            animation: "shimmer 3s infinite linear"
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>

      {/* LEFT PANEL */}
      <div className="relative w-full md:w-1/2 min-h-[50vh] md:min-h-screen border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between p-8 lg:p-16 overflow-hidden z-10"
           style={{ borderColor: "hsl(var(--border))" }}>
        
        {/* Ambient Glow Orbs */}
        <div 
          className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
          style={{ 
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
            animation: "float 10s ease-in-out infinite"
          }} 
        />
        <div 
          className="absolute bottom-1/4 right-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
          style={{ 
            background: "radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)",
            animation: "float 12s ease-in-out infinite reverse"
          }} 
        />

        {/* Dot Grid Pattern */}
        <div 
          className="absolute inset-0 z-[-1] opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at center, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Top Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ 
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(38 90% 40%))",
                boxShadow: "0 0 20px hsl(var(--primary) / 0.3)"
              }}
            >
              <SiRoblox className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              RoCheck
            </h1>
          </div>
          <p className="text-xl text-white/60 font-medium">Studio Operations Hub</p>
        </div>

        {/* Feature List */}
        <div className="relative z-10 mt-12 md:mt-0 space-y-6 max-w-sm">
          <div className="flex items-start gap-4">
            <div className="mt-1 p-2 rounded-lg bg-white/5 border border-white/10" style={{ borderColor: "hsl(var(--border))" }}>
              <Activity className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Real-time CCU tracking</h3>
              <p className="text-sm text-white/50 mt-1">Monitor live concurrent users across all your experiences instantly.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="mt-1 p-2 rounded-lg bg-white/5 border border-white/10" style={{ borderColor: "hsl(var(--border))" }}>
              <LayoutDashboard className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Team Kanban boards</h3>
              <p className="text-sm text-white/50 mt-1">Organize your studio's tasks, milestones, and daily standups efficiently.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="mt-1 p-2 rounded-lg bg-white/5 border border-white/10" style={{ borderColor: "hsl(var(--border))" }}>
              <Shield className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Roblox OAuth secured</h3>
              <p className="text-sm text-white/50 mt-1">Enterprise-grade security using native Roblox authentication.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 lg:p-12 z-20 relative">
        <div 
          className="w-full max-w-md p-8 md:p-10 rounded-2xl border backdrop-blur-sm shadow-2xl relative"
          style={{ 
            backgroundColor: "hsl(var(--card) / 0.8)", 
            borderColor: "hsl(var(--border))",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px hsl(var(--border)) inset"
          }}
        >
          {/* Subtle top glow on card */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] opacity-50"
            style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)" }}
          />

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border flex items-center justify-center mb-6" style={{ borderColor: "hsl(var(--border))" }}>
              <SiRoblox className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-white/50 text-sm md:text-base">Sign in to your RoVerse workspace</p>
          </div>

          <button 
            className="w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 font-semibold text-black transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
            style={{ 
              background: "linear-gradient(to right, hsl(var(--primary)), hsl(38 90% 60%))",
              boxShadow: "0 0 20px hsl(var(--primary) / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.2)"
            }}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out" />
            <SiRoblox className="w-5 h-5" />
            Continue with Roblox
          </button>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium px-4 py-3 rounded-lg bg-black/40 border border-white/5 text-white/40">
            <Shield className="w-4 h-4" />
            Access restricted to RoVerseFR members
          </div>
        </div>
      </div>
    </div>
  );
}
