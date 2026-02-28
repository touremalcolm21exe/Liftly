import { useMemo } from 'react';
import { useTheme } from '@/lib/ThemeContext';

export function useThemedStyles<T>(stylesFn: (colors: any) => T): T {
  const { colors } = useTheme();
  return useMemo(() => stylesFn(colors), [colors]);
}
