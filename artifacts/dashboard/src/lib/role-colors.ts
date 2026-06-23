export const SUBROLE_COLORS: Record<string, string> = {
  Scripter: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
  Investor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  Investisseur: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'UI Maker': 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  Builder: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  Modeler: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
  Animator: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  'Sound Designer': 'bg-teal-500/20 text-teal-400 border border-teal-500/30',
  'Game Designer': 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  'Content Creator Manager': 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
};

export const SUBROLE_DOT_COLORS: Record<string, string> = {
  Scripter: 'bg-violet-400',
  Investor: 'bg-emerald-400',
  Investisseur: 'bg-emerald-400',
  'UI Maker': 'bg-cyan-400',
  Builder: 'bg-orange-400',
  Modeler: 'bg-pink-400',
  Animator: 'bg-yellow-400',
  'Sound Designer': 'bg-teal-400',
  'Game Designer': 'bg-indigo-400',
  'Content Creator Manager': 'bg-rose-400',
};

export function getSubroleClasses(sr: string): string {
  return SUBROLE_COLORS[sr] ?? 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
}

export function getSubroleDot(sr: string): string {
  return SUBROLE_DOT_COLORS[sr] ?? 'bg-blue-400';
}

export const SUBROLE_AVATAR_COLORS: Record<string, string> = {
  Scripter: 'bg-violet-500/20 text-violet-400',
  Investor: 'bg-emerald-500/20 text-emerald-400',
  Investisseur: 'bg-emerald-500/20 text-emerald-400',
  'UI Maker': 'bg-cyan-500/20 text-cyan-400',
  Builder: 'bg-orange-500/20 text-orange-400',
  Modeler: 'bg-pink-500/20 text-pink-400',
  Animator: 'bg-yellow-500/20 text-yellow-400',
  'Sound Designer': 'bg-teal-500/20 text-teal-400',
  'Game Designer': 'bg-indigo-500/20 text-indigo-400',
  'Content Creator Manager': 'bg-rose-500/20 text-rose-400',
};

export function getAvatarClasses(role: string, subroles: string[]): string {
  if (role === 'admin') return 'bg-red-500/20 text-red-400';
  const sr = subroles?.[0];
  if (sr) return SUBROLE_AVATAR_COLORS[sr] ?? 'bg-blue-500/20 text-blue-400';
  return 'bg-blue-500/20 text-blue-400';
}
