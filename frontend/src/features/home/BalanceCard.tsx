import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Target,
  TriangleAlert,
} from 'lucide-react-native';
import { AppText } from '@/components/AppText';
import { ProgressBar } from '@/components/ProgressBar';
import { colors, radii, shadow, space } from '@/theme/tokens';
import type { Budget, MonthSummary } from '@/data/types';
import { formatMonthLabel } from '@/utils/date';
import { formatPercent, formatRupiah } from '@/utils/format';

type BalanceCardProps = {
  summary: MonthSummary;
  totalSummary?: MonthSummary;
  month: string;
  budget: Budget | null | undefined;
  onBudgetPress: () => void;
  onMonthPress: () => void;
};

function moneySize(value: number): number {
  const length = formatRupiah(value).length;
  if (length >= 16) return 26;
  if (length >= 13) return 30;
  return 36;
}

export function BalanceCard({
  summary,
  totalSummary,
  month,
  budget,
  onBudgetPress,
  onMonthPress,
}: BalanceCardProps) {
  const [viewMode, setViewMode] = useState<'month' | 'total'>('month');
  const activeSummary =
    viewMode === 'total' && totalSummary ? totalSummary : summary;

  const used = budget?.period === 'daily' ? summary.todayExpense : summary.expense;
  const percent = budget && budget.amount > 0 ? (used / budget.amount) * 100 : 0;
  const remaining = budget ? budget.amount - used : 0;
  const over = percent >= 100;
  const warning = percent >= 80;

  return (
    <View
      accessible
      accessibilityLabel={`Saldo ${viewMode === 'month' ? `bulan ${formatMonthLabel(month)}` : 'total keseluruhan'} ${formatRupiah(
        activeSummary.balance,
      )}. Masuk ${formatRupiah(activeSummary.income)}, keluar ${formatRupiah(
        activeSummary.expense,
      )}.`}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText variant="labelSm" weight="semiBold" color={colors.onPrimary}>
            Saldo
          </AppText>
          <AppText variant="labelSm" color={colors.onPrimary} style={{ opacity: 0.8 }}>
            {viewMode === 'month' ? formatMonthLabel(month) : 'Total Semua Waktu'}
          </AppText>
        </View>

        <View style={styles.togglePillGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tampilkan saldo bulan ini"
            onPress={() => {
              void Haptics.selectionAsync();
              setViewMode('month');
            }}
            style={[
              styles.togglePill,
              viewMode === 'month' ? styles.togglePillActive : null,
            ]}
          >
            <AppText
              variant="labelSm"
              weight="semiBold"
              color={viewMode === 'month' ? colors.primary : colors.canvas}
            >
              Bulan ini
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tampilkan total saldo keseluruhan"
            onPress={() => {
              void Haptics.selectionAsync();
              setViewMode('total');
            }}
            style={[
              styles.togglePill,
              viewMode === 'total' ? styles.togglePillActive : null,
            ]}
          >
            <AppText
              variant="labelSm"
              weight="semiBold"
              color={viewMode === 'total' ? colors.primary : colors.canvas}
            >
              Total
            </AppText>
          </Pressable>
        </View>
      </View>

      <AppText
        variant="headingMd"
        color={colors.canvas}
        tabular
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontSize: moneySize(activeSummary.balance), lineHeight: moneySize(activeSummary.balance) + 4 }}
      >
        {formatRupiah(activeSummary.balance)}
      </AppText>

      <View style={styles.totals}>
        <View style={styles.totalCell}>
          <View style={styles.totalLabel}>
            <ArrowDownLeft size={12} color={colors.onPrimary} />
            <AppText variant="labelSm" weight="medium" color={colors.onPrimary}>
              Masuk
            </AppText>
          </View>
          <AppText variant="bodyMd" weight="semiBold" color={colors.canvas} tabular>
            {formatRupiah(activeSummary.income)}
          </AppText>
        </View>
        <View style={[styles.totalCell, styles.totalDivider]}>
          <View style={styles.totalLabel}>
            <ArrowUpRight size={12} color={colors.onPrimary} />
            <AppText variant="labelSm" weight="medium" color={colors.onPrimary}>
              Keluar
            </AppText>
          </View>
          <AppText variant="bodyMd" weight="semiBold" color={colors.canvas} tabular>
            {formatRupiah(activeSummary.expense)}
          </AppText>
        </View>
      </View>

      <View style={styles.budgetBlock}>
        {budget ? (
          <>
            <View style={styles.budgetHeader}>
              <AppText variant="labelSm" weight="medium" color={colors.onPrimary}>
                Batas {budget.period === 'daily' ? 'harian' : 'bulanan'}
                {viewMode === 'total' ? ' (bulan ini)' : ''}
              </AppText>
              <AppText variant="labelSm" weight="semiBold" color={colors.canvas}>
                {formatPercent(percent)} terpakai
              </AppText>
            </View>
            <ProgressBar percent={percent} trackColor={colors.primaryActive} />
            <View style={styles.budgetFooter}>
              <AppText variant="labelSm" color={colors.onPrimary}>
                {over
                  ? `Lewat ${formatRupiah(Math.abs(remaining))}`
                  : `Sisa ${formatRupiah(Math.max(remaining, 0))}`}
              </AppText>
              {warning ? (
                <View style={styles.warningRow}>
                  <TriangleAlert size={12} color={over ? colors.pink : colors.yellow} />
                  <AppText
                    variant="labelSm"
                    weight="semiBold"
                    color={over ? colors.pink : colors.yellow}
                  >
                    {over ? 'Batas terlampaui' : 'Hampir batas'}
                  </AppText>
                </View>
              ) : (
                <AppText variant="labelSm" color={colors.onPrimary}>
                  Masih aman
                </AppText>
              )}
            </View>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atur batas pengeluaran"
            onPress={onBudgetPress}
            style={({ pressed }) => [styles.budgetEmpty, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={styles.budgetEmptyIcon}>
              <Target size={16} color={colors.primary} />
            </View>
            <View style={styles.budgetEmptyCopy}>
              <AppText variant="bodySm" weight="semiBold" color={colors.canvas}>
                Belum ada batas belanja
              </AppText>
              <AppText variant="labelSm" color={colors.onPrimary}>
                Atur pengingat supaya nggak boncos.
              </AppText>
            </View>
            <AppText variant="labelSm" weight="semiBold" color={colors.lime}>
              Atur
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.xl,
    padding: space.xxl,
    backgroundColor: colors.primary,
    borderRadius: radii.panel,
    ...shadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginBottom: space.lg,
  },
  headerLeft: {
    gap: 2,
  },
  togglePillGroup: {
    flexDirection: 'row',
    backgroundColor: colors.primaryActive,
    borderRadius: radii.pill,
    padding: 3,
    gap: 2,
  },
  togglePill: {
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  togglePillActive: {
    backgroundColor: colors.mint,
  },
  totals: {
    flexDirection: 'row',
    marginTop: space.xxl,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: colors.primaryActive,
  },
  totalCell: {
    flex: 1,
    minWidth: 0,
  },
  totalDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.primaryActive,
    paddingLeft: space.lg,
    marginLeft: space.lg,
  },
  totalLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginBottom: 2,
  },
  budgetBlock: {
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.primaryActive,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.md,
  },
  budgetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.md,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  budgetEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  budgetEmptyIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  budgetEmptyCopy: {
    flex: 1,
    minWidth: 0,
  },
});
