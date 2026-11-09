import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import * as Haptics from 'expo-haptics';
import {
  Briefcase,
  ChartNoAxesColumn,
  CirclePlus,
  History,
  type LucideIcon,
} from 'lucide-react-native';
import { AppText } from './AppText';
import { colors, layout, radii, space } from '@/theme/tokens';

const TAB_META: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Catat', icon: CirclePlus },
  riwayat: { label: 'Riwayat', icon: History },
  produk: { label: 'Bisnis', icon: Briefcase },
  analisis: { label: 'Analisis', icon: ChartNoAxesColumn },
};

export function BottomNav({
  state,
  descriptors,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, space.md) },
      ]}
    >
      <View style={styles.inner} accessibilityRole="tablist" accessibilityLabel="Navigasi utama">
        {state.routes.map((route, index) => {
          const options = descriptors[route.key]?.options as
            | { href?: string | null }
            | undefined;
          if (options?.href === null || !TAB_META[route.name]) {
            return null;
          }
          const focused = state.index === index;
          const meta = TAB_META[route.name];
          const Icon = meta.icon;
          const onPress = () => {
            if (!focused) {
              void Haptics.selectionAsync();
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tab,
                focused ? styles.tabActive : null,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Icon
                size={20}
                color={focused ? colors.primary : colors.textMuted}
                strokeWidth={focused ? 2.2 : 2}
              />
              <AppText
                variant="labelSm"
                weight={focused ? 'semiBold' : 'medium'}
                color={focused ? colors.primary : colors.textMuted}
              >
                {meta.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: space.md,
    paddingHorizontal: space.lg,
  },
  inner: {
    width: '100%',
    maxWidth: layout.pageMaxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: space.xs,
  },
  tab: {
    flex: 1,
    minHeight: 52,
    paddingVertical: space.md,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  tabActive: {
    backgroundColor: colors.mint,
  },
});
