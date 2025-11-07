export function useEventColors() {
  const colorKeys = [
    'blue',
    'green', 
    'yellow',
    'purple',
    'pink',
    'indigo',
    'red',
    'orange',
    'teal',
    'cyan',
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
    return `bg-${key}-500`;
  };

  const getColorForApp = (appName: string): string => {
    const key = getColorKeyForApp(appName);
    return `bg-${key}-500`;
  };

  const getGradientForSession = (sessionId: string): string => {
    const baseColor = getColorForSession(sessionId);

    const gradientMap: Record<string, string> = {
      'bg-blue-500': 'from-blue-500 to-blue-600',
      'bg-green-500': 'from-green-500 to-green-600',
      'bg-yellow-500': 'from-yellow-500 to-yellow-600',
      'bg-purple-500': 'from-purple-500 to-purple-600',
      'bg-pink-500': 'from-pink-500 to-pink-600',
      'bg-indigo-500': 'from-indigo-500 to-indigo-600',
      'bg-red-500': 'from-red-500 to-red-600',
      'bg-orange-500': 'from-orange-500 to-orange-600',
      'bg-teal-500': 'from-teal-500 to-teal-600',
      'bg-cyan-500': 'from-cyan-500 to-cyan-600',
    };

    return `bg-gradient-to-r ${gradientMap[baseColor] || 'from-gray-500 to-gray-600'}`;
  };

  const getGradientForApp = (appName: string): string => {
    const baseColor = getColorForApp(appName);

    const gradientMap: Record<string, string> = {
      'bg-blue-500': 'from-blue-500 to-blue-600',
      'bg-green-500': 'from-green-500 to-green-600',
      'bg-yellow-500': 'from-yellow-500 to-yellow-600',
      'bg-purple-500': 'from-purple-500 to-purple-600',
      'bg-pink-500': 'from-pink-500 to-pink-600',
      'bg-indigo-500': 'from-indigo-500 to-indigo-600',
      'bg-red-500': 'from-red-500 to-red-600',
      'bg-orange-500': 'from-orange-500 to-orange-600',
      'bg-teal-500': 'from-teal-500 to-teal-600',
      'bg-cyan-500': 'from-cyan-500 to-cyan-600',
    };

    return `bg-gradient-to-r ${gradientMap[baseColor] || 'from-gray-500 to-gray-600'}`;
  };

  const tailwindToHex = (tailwindClass: string): string => {
    const colorMap: Record<string, string> = {
      'bg-blue-500': '#3B82F6',
      'bg-green-500': '#22C55E',
      'bg-yellow-500': '#EAB308',
      'bg-purple-500': '#A855F7',
      'bg-pink-500': '#EC4899',
      'bg-indigo-500': '#6366F1',
      'bg-red-500': '#EF4444',
      'bg-orange-500': '#F97316',
      'bg-teal-500': '#14B8A6',
      'bg-cyan-500': '#06B6D4',
    };
    return colorMap[tailwindClass] || '#3B82F6';
  };

  const getHexColorForSession = (sessionId: string): string => {
    const tailwindClass = getColorForSession(sessionId);
    return tailwindToHex(tailwindClass);
  };

  const getHexColorForApp = (appName: string): string => {
    const hash = hashString(appName);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
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