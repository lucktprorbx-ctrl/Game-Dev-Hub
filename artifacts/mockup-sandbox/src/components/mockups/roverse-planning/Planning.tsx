import React, { useState } from "react";
import { 
  Kanban, 
  Calendar, 
  StickyNote, 
  Plus, 
  Layout, 
  Gamepad2, 
  Shield, 
  Rocket, 
  Palette, 
  Sparkles, 
  Lock, 
  CalendarX,
  Search,
  Bell,
  Settings,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BOARDS = [
  { 
    id: 1, 
    name: "Core Infrastructure", 
    icon: Shield, 
    twColor: "text-amber-500", 
    twBg: "bg-amber-500/10", 
    twBorder: "border-amber-500", 
    glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]", 
    team: "Backend", 
    taskCount: 24,
    description: "Server architecture and database migrations for the new scaling requirements."
  },
  { 
    id: 2, 
    name: "Game Mechanics", 
    icon: Gamepad2, 
    twColor: "text-indigo-500", 
    twBg: "bg-indigo-500/10", 
    twBorder: "border-indigo-500", 
    glow: "hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]", 
    team: "Gameplay", 
    taskCount: 18,
    description: "Combat system revamp and physics engine adjustments."
  },
  { 
    id: 3, 
    name: "World Building", 
    icon: Palette, 
    twColor: "text-emerald-500", 
    twBg: "bg-emerald-500/10", 
    twBorder: "border-emerald-500", 
    glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]", 
    team: "Environment", 
    taskCount: 42,
    description: "Level design for the new cyberpunk city zone."
  },
  { 
    id: 4, 
    name: "Marketing Assets", 
    icon: Sparkles, 
    twColor: "text-pink-500", 
    twBg: "bg-pink-500/10", 
    twBorder: "border-pink-500", 
    glow: "hover:shadow-[0_0_20px_rgba(236,72,153,0.15)]", 
    team: "Creative", 
    taskCount: 12,
    description: "Promo videos and social media banners for Q3."
  },
  { 
    id: 5, 
    name: "UI Redesign", 
    icon: Layout, 
    twColor: "text-sky-500", 
    twBg: "bg-sky-500/10", 
    twBorder: "border-sky-500", 
    glow: "hover:shadow-[0_0_20px_rgba(14,165,233,0.15)]", 
    team: "Frontend", 
    taskCount: 31,
    description: "Main menu overhaul and accessibility improvements."
  },
  { 
    id: 6, 
    name: "Launch Prep", 
    icon: Rocket, 
    twColor: "text-violet-500", 
    twBg: "bg-violet-500/10", 
    twBorder: "border-violet-500", 
    glow: "hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]", 
    team: "Management", 
    taskCount: 8,
    description: "Final QA checklist and release coordination."
  },
];

export function Planning() {
  const [activeTab, setActiveTab] = useState<"kanban" | "calendar" | "notes">("kanban");

  return (
    <div className="flex min-h-screen font-sans selection:bg-amber-500/30" style={{ background: 'hsl(0 0% 4%)', color: 'hsl(0 0% 90%)' }}>
      {/* Sidebar Placeholder */}
      <aside className="w-64 fixed inset-y-0 left-0 border-r z-20 flex flex-col" style={{ background: 'hsl(0 0% 5%)', borderColor: 'hsl(0 0% 12%)' }}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-black font-bold text-xl">
            R
          </div>
          <span className="font-semibold text-lg tracking-tight">RoVerse</span>
        </div>
        <div className="px-4 py-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Main Menu</div>
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-colors">
              <Home size={18} /> Dashboard
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md bg-amber-500/10 text-amber-500 font-medium transition-colors">
              <Kanban size={18} /> Planning
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-colors">
              <Shield size={18} /> Teams
            </button>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t" style={{ borderColor: 'hsl(0 0% 12%)' }}>
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
              <span className="text-xs font-medium">JD</span>
            </div>
            <div className="text-sm">
              <div className="font-medium">Jane Doe</div>
              <div className="text-gray-500 text-xs">Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 border-b flex items-center justify-between px-8 sticky top-0 z-10 backdrop-blur-md" style={{ background: 'hsla(0, 0%, 4%, 0.8)', borderColor: 'hsl(0 0% 12%)' }}>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Planning</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Search size={20} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full"></span>
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col">
          {/* Header & Controls */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex p-1 rounded-full border" style={{ background: 'hsl(0 0% 6%)', borderColor: 'hsl(0 0% 12%)' }}>
              <button 
                onClick={() => setActiveTab("kanban")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'kanban' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Kanban size={16} /> Boards
              </button>
              <button 
                onClick={() => setActiveTab("calendar")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Calendar size={16} /> Calendar
              </button>
              <button 
                onClick={() => setActiveTab("notes")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'notes' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <StickyNote size={16} /> Notes
              </button>
            </div>

            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2 rounded-full px-6 h-10 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Plus size={18} /> New Board
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BOARDS.map((board) => (
                <div 
                  key={board.id} 
                  className={`group relative overflow-hidden rounded-xl border flex flex-col p-6 transition-all duration-300 cursor-pointer ${board.glow}`}
                  style={{ background: 'hsl(0 0% 7%)', borderColor: 'hsl(0 0% 12%)' }}
                >
                  {/* Left Color Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${board.twBg} ${board.twColor.replace('text', 'bg')}`}></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg ${board.twBg} ${board.twColor}`}>
                      <board.icon size={24} />
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border" style={{ background: 'hsl(0 0% 10%)', borderColor: 'hsl(0 0% 16%)' }}>
                      <span className="text-gray-400">{board.taskCount} tasks</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2 text-white group-hover:text-gray-100 transition-colors">{board.name}</h3>
                  <p className="text-sm text-gray-400 mb-6 flex-1 line-clamp-2 leading-relaxed">
                    {board.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed" style={{ borderColor: 'hsl(0 0% 16%)' }}>
                    <div className="flex items-center gap-1.5">
                      <Lock size={14} className={board.twColor} />
                      <span className={`text-sm font-medium ${board.twColor}`}>{board.team}</span>
                    </div>
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center bg-gray-800 text-[10px] font-bold" style={{ borderColor: 'hsl(0 0% 7%)' }}>
                          U{i}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 text-center" style={{ borderColor: 'hsl(0 0% 12%)', background: 'hsl(0 0% 5%)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-800 mb-4 shadow-inner">
                <CalendarX size={32} className="text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Calendar Events</h3>
              <p className="text-gray-400 max-w-md mb-6">
                Your calendar is currently empty. Start planning by creating a new event or syncing your team's tasks with deadlines.
              </p>
              <Button variant="outline" className="gap-2 border-gray-700 hover:bg-gray-800 hover:text-white">
                <Plus size={16} /> Add Event
              </Button>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 text-center" style={{ borderColor: 'hsl(0 0% 12%)', background: 'hsl(0 0% 5%)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-800 mb-4 shadow-inner">
                <StickyNote size={32} className="text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Workspace Notes</h3>
              <p className="text-gray-400 max-w-md mb-6">
                Capture high-level ideas, meeting summaries, and shared documentation for your project.
              </p>
              <Button variant="outline" className="gap-2 border-gray-700 hover:bg-gray-800 hover:text-white">
                <Plus size={16} /> Create Note
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
