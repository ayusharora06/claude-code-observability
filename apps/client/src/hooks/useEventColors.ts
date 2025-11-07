export function useEventColors() {
  const colorKeys = [
    'gray',
    'slate', 
    'zinc',
    'neutral',
    'stone',
    'gray',
    'slate',
    'zinc',
    'neutral',
    'stone',
  ] as const;

  type ColorKey = typeof colorKeys[number];

  const hashString = (str: string): number => {
    let hash = 7151;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash >>> 0);
  };

  const getColorKeyForSession = (sessionId: string): ColorKey => {
    const hash = hashString(sessionId);
    const index = hash % colorKeys.length;
    return colorKeys[index];
  };

  const getColorKeyForApp = (appName: string): ColorKey => {
    const hash = hashString(appName);
    const index = hash % colorKeys.length;
    return colorKeys[index];
  };

  // Legacy functions for backward compatibility
  const getColorForSession = (sessionId: string): string => {
    const key = getColorKeyForSession(sessionId);
    return `bg-${key}-700`;
  };

  const getColorForApp = (appName: string): string => {
    const key = getColorKeyForApp(appName);
    return `bg-${key}-700`;
  };

  const getGradientForSession = (sessionId: string): string => {
    const baseColor = getColorForSession(sessionId);

    const gradientMap: Record<string, string> = {
      'bg-gray-700': 'from-gray-700 to-gray-800',
      'bg-slate-700': 'from-slate-700 to-slate-800',
      'bg-zinc-700': 'from-zinc-700 to-zinc-800',
      'bg-neutral-700': 'from-neutral-700 to-neutral-800',
      'bg-stone-700': 'from-stone-700 to-stone-800',
    };

    return `bg-gradient-to-r ${gradientMap[baseColor] || 'from-gray-700 to-gray-800'}`;
  };

  const getGradientForApp = (appName: string): string => {
    const baseColor = getColorForApp(appName);

    const gradientMap: Record<string, string> = {
      'bg-gray-700': 'from-gray-700 to-gray-800',
      'bg-slate-700': 'from-slate-700 to-slate-800',
      'bg-zinc-700': 'from-zinc-700 to-zinc-800',
      'bg-neutral-700': 'from-neutral-700 to-neutral-800',
      'bg-stone-700': 'from-stone-700 to-stone-800',
    };

    return `bg-gradient-to-r ${gradientMap[baseColor] || 'from-gray-700 to-gray-800'}`;
  };

  const tailwindToHex = (tailwindClass: string): string => {
    const colorMap: Record<string, string> = {
      'bg-gray-700': '#374151',
      'bg-slate-700': '#334155',
      'bg-zinc-700': '#3f3f46',
      'bg-neutral-700': '#404040',
      'bg-stone-700': '#44403c',
    };
    return colorMap[tailwindClass] || '#374151';
  };

  const getHexColorForSession = (sessionId: string): string => {
    const tailwindClass = getColorForSession(sessionId);
    return tailwindToHex(tailwindClass);
  };

  const getHexColorForApp = (appName: string): string => {
    const hash = hashString(appName);
    // Generate different gray lightness values between 35% and 50%
    const lightness = 35 + (hash % 16); // Range: 35% - 50%
    return `hsl(0, 0%, ${lightness}%)`;
  };

  return {
    getColorForSession,
    getColorForApp,
    getColorKeyForSession,
    getColorKeyForApp,
    getGradientForSession,
    getGradientForApp,
    getHexColorForSession,
    getHexColorForApp
  };
}