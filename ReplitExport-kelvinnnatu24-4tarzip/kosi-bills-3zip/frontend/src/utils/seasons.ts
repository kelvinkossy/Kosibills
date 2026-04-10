export type Season = 'christmas' | 'easter' | 'salah' | 'newyear' | 'default';

export function getCurrentSeason(): Season {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();

  // Christmas: Dec 1 - Dec 31
  if (month === 11) return 'christmas';

  // New Year: Jan 1 - Jan 7
  if (month === 0 && day <= 7) return 'newyear';

  // Easter 2026: April 5 (Let's use a range around it)
  // In a real app, you'd calculate this or use a library
  if (month === 3 && day >= 1 && day <= 15) return 'easter';

  // Salah (Eid al-Fitr 2026: ~March 20)
  if (month === 2 && day >= 15 && day <= 31) return 'salah';

  return 'default';
}

export function getSeasonStyles(season: Season) {
  switch (season) {
    case 'christmas':
      return {
        primary: 'bg-red-600',
        secondary: 'bg-emerald-600',
        accent: 'text-red-600',
        bg: 'bg-red-50 dark:bg-red-950/10',
        icon: '🎄',
        greeting: 'Merry Christmas!'
      };
    case 'newyear':
      return {
        primary: 'bg-indigo-600',
        secondary: 'bg-amber-500',
        accent: 'text-amber-500',
        bg: 'bg-indigo-50 dark:bg-indigo-950/10',
        icon: '🎆',
        greeting: 'Happy New Year!'
      };
    case 'easter':
      return {
        primary: 'bg-purple-500',
        secondary: 'bg-yellow-400',
        accent: 'text-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-950/10',
        icon: '🐣',
        greeting: 'Happy Easter!'
      };
    case 'salah':
      return {
        primary: 'bg-emerald-600',
        secondary: 'bg-amber-400',
        accent: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-950/10',
        icon: '🌙',
        greeting: 'Eid Mubarak!'
      };
    default:
      return {
        primary: 'bg-indigo-600',
        secondary: 'bg-slate-800',
        accent: 'text-indigo-600',
        bg: 'bg-slate-50 dark:bg-slate-900',
        icon: '⚡',
        greeting: 'Welcome back!'
      };
  }
}
