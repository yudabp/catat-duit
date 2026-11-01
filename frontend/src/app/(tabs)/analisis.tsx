import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ReceiptText,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react-native';
import { AppScaffold } from '@/components/AppScaffold';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { DonutChart } from '@/components/DonutChart';
import { EmptyState } from '@/components/EmptyState';
import { LineChart } from '@/components/LineChart';
import { SegmentedControl } from '@/components/SegmentedControl';
import {
  useAvailableMonths,
  useCategoryBreakdown,
  useDailyTrend,
  useMonthSummary,
  useTotalSummary,
} from '@/hooks/useData';
import type { MonthSummary, TransactionType } from '@/data/types';
import { colors, radii, space } from '@/theme/tokens';
import {
  currentMonthKey,
  dayNumber,
  formatMonthLabel,
  todayISO,
} from '@/utils/date';
import { formatRupiah } from '@/utils/format';

const EMPTY_SUMMARY: MonthSummary = {
  month: currentMonthKey(),
  income: 0,
  expense: 0,
  balance: 0,
  transactionCount: 0,
  incomeCount: 0,
  expenseCount: 0,
  todayExpense: 0,
};

type WarningLevel = 'safe' | 'warning' | 'over';
type Timeframe = 'monthly' | 'total';

function getWarning(summary: MonthSummary, isAllTime = false) {
  const periodLabel = isAllTime ? 'seluruh waktu' : 'bulan ini';
  if (summary.expense === 0) {
    return {
      level: 'safe' as WarningLevel,
      ratio: 0,
      title: 'Keuangan aman',
      detail: `Belum ada pengeluaran ${periodLabel}.`,
    };
  }
  if (summary.income <= 0) {
    return {
      level: 'over' as WarningLevel,
      ratio: null,
      title: 'Lewat batas',
      detail: `Belum ada pemasukan ${periodLabel}, tetapi pengeluaran sudah ${formatRupiah(
        summary.expense,
      )}.`,
    };
  }
  const ratio = (summary.expense / summary.income) * 100;
  const rounded = Math.round(ratio);
  if (ratio >= 100) {
    return {
      level: 'over' as WarningLevel,
      ratio,
      title: 'Lewat batas',
      detail: `Pengeluaran ${rounded}% dari pemasukan. Defisit ${formatRupiah(
        Math.abs(summary.balance),
      )}.`,
    };
  }
  if (ratio >= 80) {
    return {
      level: 'warning' as WarningLevel,
      ratio,
      title: 'Hampir boncos',
      detail: `Pengeluaran ${rounded}% dari pemasukan. Sisa saldo ${formatRupiah(
        summary.balance,
      )}.`,
    };
  }
  return {
    level: 'safe' as WarningLevel,
    ratio,
    title: 'Keuangan aman',
    detail: `Pengeluaran ${rounded}% dari pemasukan. Sisa saldo ${formatRupiah(
      summary.balance,
    )}.`,
  };
}

function WarningCard({
  level,
  title,
  detail,
}: {
  level: WarningLevel;
  title: string;
  detail: string;
}) {
  const tone =
    level === 'over'
      ? {
          background: colors.dangerSoft,
          border: colors.danger,
          color: colors.danger,
          Icon: CircleAlert,
        }
      : level === 'warning'
        ? {
            background: colors.warningSoft,
            border: colors.warning,
            color: colors.warning,
            Icon: TriangleAlert,
          }
        : {
            background: colors.positiveSoft,
            border: colors.positive,
            color: colors.positive,
            Icon: ShieldCheck,
          };
  const Icon = tone.Icon;
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.warningCard,
        { backgroundColor: tone.background, borderColor: tone.border },
      ]}
    >
      <View style={styles.warningHeader}>
        <Icon size={20} color={tone.color} />
        <AppText variant="bodySm" weight="semiBold" color={tone.color}>
          {title}
        </AppText>
      </View>
      <AppText variant="labelSm" color={tone.color} style={styles.warningDetail}>
        {detail}
      </AppText>
    </View>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.titleTextWrap}>
      <AppText variant="bodyLg" style={styles.sectionTitle}>
        {title}
      </AppText>
      <AppText variant="labelSm" color={colors.textMuted}>
        {subtitle}
      </AppText>
    </View>
  );
}

export default function AnalyticsScreen() {
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly');
  const [month, setMonth] = useState(currentMonthKey());
  const [breakdownType, setBreakdownType] = useState<TransactionType>('expense');
  const [trendType, setTrendType] = useState<TransactionType>('expense');

  const { data: months } = useAvailableMonths();
  const { data: monthlySummary } = useMonthSummary(month);
  const { data: totalSummary } = useTotalSummary();

  const isAllTime = timeframe === 'total';
  const activeMonthParam = isAllTime ? 'all' : month;

  const { data: breakdown } = useCategoryBreakdown(activeMonthParam, breakdownType);
  const { data: trend } = useDailyTrend(month);

  const safeMonthlySummary = monthlySummary ?? { ...EMPTY_SUMMARY, month };
  const safeTotalSummary = totalSummary ?? { ...EMPTY_SUMMARY, month: 'all' };
  const activeSummary = isAllTime ? safeTotalSummary : safeMonthlySummary;

  const warning = getWarning(activeSummary, isAllTime);
  const balance = activeSummary.balance;

  const monthIndex = months?.findIndex((item) => item.month === month) ?? -1;
  const canGoOlder = Boolean(
    months && monthIndex >= 0 && monthIndex < months.length - 1,
  );
  const canGoNewer = Boolean(months && monthIndex > 0);

  const goOlder = () => {
    if (!months || monthIndex < 0 || monthIndex >= months.length - 1) return;
    setMonth(months[monthIndex + 1]!.month);
  };
  const goNewer = () => {
    if (!months || monthIndex <= 0) return;
    setMonth(months[monthIndex - 1]!.month);
  };

  // Daily Trend calculation for monthly view
  const trendDays = trend?.days ?? [];
  const trendPoints = trendDays.map((day) => ({
    value: trendType === 'expense' ? day.expense : day.income,
    label: String(dayNumber(day.date)),
  }));
  const trendTotal = trendDays.reduce(
    (sum, day) => sum + (trendType === 'expense' ? day.expense : day.income),
    0,
  );
  const elapsedDays =
    month === currentMonthKey()
      ? Math.max(1, Number(todayISO().slice(8, 10)))
      : Math.max(1, trendDays.length);
  const dailyAverage = Math.round(trendTotal / elapsedDays);

  const highest = trendDays.reduce<{
    date: string;
    value: number;
    index: number;
  } | null>((best, day, index) => {
    const val = trendType === 'expense' ? day.expense : day.income;
    if (val <= 0) return best;
    if (!best || val > best.value) {
      return { date: day.date, value: val, index };
    }
    return best;
  }, null);

  const labelIndexes = [0, 7, 14, 21, 28].filter(
    (index) => index < trendPoints.length,
  );

  // Comparison Masuk vs Keluar
  const comparisonMax = Math.max(
    activeSummary.income,
    activeSummary.expense,
    1,
  );
  const incomeWidth = (activeSummary.income / comparisonMax) * 100;
  const expenseWidth = (activeSummary.expense / comparisonMax) * 100;

  return (
    <AppScaffold>
      {/* Header */}
      <View>
        <AppText
          variant="labelSm"
          weight="medium"
          color={colors.textSubtle}
          style={styles.eyebrow}
        >
          REKAP & ANALISIS KEUANGAN
        </AppText>
        <AppText variant="headingSm" style={styles.title}>
          Analisis
        </AppText>
        <AppText variant="bodySm" color={colors.textMuted}>
          Grafik pemasukan, pengeluaran, dan rekap keuangan bulanan maupun total.
        </AppText>
      </View>

      {/* Pilihan Periode: Bulanan vs Total Keseluruhan */}
      <View style={styles.timeframeSection}>
        <SegmentedControl
          label="Pilih periode rekap"
          value={timeframe}
          onChange={(val) => {
            void Haptics.selectionAsync();
            setTimeframe(val as Timeframe);
          }}
          options={[
            { value: 'monthly', label: 'Bulanan' },
            { value: 'total', label: 'Total Keseluruhan' },
          ]}
        />
      </View>

      {/* Selector Bulan (untuk Bulanan) atau Banner Semua Waktu */}
      {!isAllTime ? (
        <Card style={styles.monthCard} padded={false}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bulan sebelumnya"
            onPress={goOlder}
            disabled={!canGoOlder}
            style={({ pressed }) => [
              styles.monthButton,
              { opacity: !canGoOlder ? 0.35 : pressed ? 0.6 : 1 },
            ]}
          >
            <ChevronLeft size={20} color={colors.textMuted} />
          </Pressable>
          <View style={styles.monthCopy} accessibilityLiveRegion="polite">
            <AppText variant="bodyLg" style={styles.monthLabel}>
              {formatMonthLabel(month)}
            </AppText>
            <AppText variant="labelSm" color={colors.textMuted}>
              Rekap bulanan
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bulan berikutnya"
            onPress={goNewer}
            disabled={!canGoNewer}
            style={({ pressed }) => [
              styles.monthButton,
              { opacity: !canGoNewer ? 0.35 : pressed ? 0.6 : 1 },
            ]}
          >
            <ChevronRight size={20} color={colors.textMuted} />
          </Pressable>
        </Card>
      ) : (
        <Card style={styles.allTimeCard}>
          <AppText variant="bodyMd" weight="bold">
            Total Seluruh Waktu
          </AppText>
          <AppText variant="labelSm" color={colors.textMuted}>
            Akumulasi semua catatan keuangan sejak pertama kali dicatat
          </AppText>
        </Card>
      )}

      {activeSummary.transactionCount === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            icon={ReceiptText}
            title={
              isAllTime
                ? 'Belum ada catatan transaksi'
                : `Belum ada catatan di ${formatMonthLabel(month)}`
            }
            description="Pilih bulan lain, atau catat transaksi pertamamu untuk melihat grafik dan rekap."
            actionLabel="Catat sekarang"
            onAction={() => router.navigate('/')}
          />
        </View>
      ) : (
        <>
          {/* Card Ringkasan Saldo & Arus Kas */}
          <View
            accessible
            accessibilityLabel={`Ringkasan ${
              isAllTime ? 'semua waktu' : formatMonthLabel(month)
            }. Saldo ${formatRupiah(balance)}, pemasukan ${formatRupiah(
              activeSummary.income,
            )}, pengeluaran ${formatRupiah(activeSummary.expense)}.`}
            style={styles.summaryCard}
          >
            <AppText variant="labelSm" weight="semiBold" color={colors.onPrimary}>
              {isAllTime ? 'Total Saldo Keseluruhan' : 'Sisa Uang Bulan Ini'}
            </AppText>
            <AppText
              variant="headingMd"
              color={colors.canvas}
              tabular
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.summaryAmount}
            >
              {formatRupiah(balance)}
            </AppText>
            <View style={styles.summaryTotals}>
              <View style={styles.summaryCell}>
                <View style={styles.summaryLabel}>
                  <ArrowDownLeft size={12} color={colors.onPrimary} />
                  <AppText variant="labelSm" weight="medium" color={colors.onPrimary}>
                    Total Masuk
                  </AppText>
                </View>
                <AppText variant="bodyMd" weight="semiBold" color={colors.canvas} tabular>
                  {formatRupiah(activeSummary.income)}
                </AppText>
              </View>
              <View style={[styles.summaryCell, styles.summaryDivider]}>
                <View style={styles.summaryLabel}>
                  <ArrowUpRight size={12} color={colors.onPrimary} />
                  <AppText variant="labelSm" weight="medium" color={colors.onPrimary}>
                    Total Keluar
                  </AppText>
                </View>
                <AppText variant="bodyMd" weight="semiBold" color={colors.canvas} tabular>
                  {formatRupiah(activeSummary.expense)}
                </AppText>
              </View>
            </View>
          </View>

          {/* Kartu Status Peringatan / Evaluasi Keuangan */}
          <WarningCard
            level={warning.level}
            title={warning.title}
            detail={warning.detail}
          />

          {/* Section 1: Grafik Kategori (Pemasukan & Pengeluaran) */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <SectionTitle
                title={
                  breakdownType === 'expense'
                    ? 'Pengeluaran per kategori'
                    : 'Pemasukan per kategori'
                }
                subtitle={isAllTime ? 'Total keseluruhan' : formatMonthLabel(month)}
              />
              <SegmentedControl
                label="Pilih jenis grafik kategori"
                value={breakdownType}
                onChange={(val) => {
                  void Haptics.selectionAsync();
                  setBreakdownType(val as TransactionType);
                }}
                options={[
                  { value: 'expense', label: 'Keluar' },
                  { value: 'income', label: 'Masuk' },
                ]}
                style={styles.inlineSegment}
              />
            </View>

            <Card style={styles.sectionCard}>
              {breakdown && breakdown.items.length > 0 ? (
                <>
                  <View style={styles.donutWrap}>
                    <DonutChart
                      items={breakdown.items}
                      total={breakdown.total}
                      size={148}
                      label={
                        breakdownType === 'expense'
                          ? 'Pengeluaran kategori'
                          : 'Pemasukan kategori'
                      }
                    />
                  </View>
                  <View style={styles.legendGrid}>
                    {breakdown.items.map((item) => (
                      <View key={item.categoryId} style={styles.legendItem}>
                        <View
                          style={[styles.legendDot, { backgroundColor: item.color }]}
                        />
                        <View style={styles.legendCopy}>
                          <View style={styles.legendTop}>
                            <AppText
                              variant="labelSm"
                              weight="semiBold"
                              numberOfLines={1}
                              style={styles.legendName}
                            >
                              {item.name}
                            </AppText>
                            <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
                              {Math.round(item.percentage)}%
                            </AppText>
                          </View>
                          <AppText variant="labelSm" color={colors.textMuted} tabular>
                            {formatRupiah(item.total)}
                          </AppText>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <EmptyState
                  compact
                  icon={ReceiptText}
                  title={`Belum ada ${breakdownType === 'expense' ? 'pengeluaran' : 'pemasukan'}`}
                  description={`Tidak ada transaksi ${
                    breakdownType === 'expense' ? 'keluar' : 'masuk'
                  } per kategori di ${isAllTime ? 'seluruh waktu' : formatMonthLabel(month)}.`}
                />
              )}
            </Card>
          </View>

          {/* Section 2: Grafik Tren Harian (Hanya di mode Bulanan) */}
          {!isAllTime ? (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <SectionTitle
                  title={
                    trendType === 'expense'
                      ? 'Tren harian keluar'
                      : 'Tren harian masuk'
                  }
                  subtitle={formatMonthLabel(month)}
                />
                <SegmentedControl
                  label="Pilih jenis tren harian"
                  value={trendType}
                  onChange={(val) => {
                    void Haptics.selectionAsync();
                    setTrendType(val as TransactionType);
                  }}
                  options={[
                    { value: 'expense', label: 'Keluar' },
                    { value: 'income', label: 'Masuk' },
                  ]}
                  style={styles.inlineSegment}
                />
              </View>

              <Card style={styles.sectionCard}>
                <View style={styles.metricRow}>
                  <View style={styles.metricCell}>
                    <AppText variant="labelSm" color={colors.textMuted}>
                      Rata-rata/hari
                    </AppText>
                    <AppText variant="bodyMd" weight="semiBold" tabular style={styles.metricValue}>
                      {formatRupiah(dailyAverage)}
                    </AppText>
                  </View>
                  <View style={[styles.metricCell, styles.metricDivider]}>
                    <AppText variant="labelSm" color={colors.textMuted}>
                      {trendType === 'expense' ? 'Keluar Tertinggi' : 'Masuk Tertinggi'}
                    </AppText>
                    <AppText variant="bodyMd" weight="semiBold" tabular style={styles.metricValue}>
                      {formatRupiah(highest?.value ?? 0)}
                    </AppText>
                  </View>
                </View>

                {trendPoints.length > 0 && trendTotal > 0 ? (
                  <View style={styles.chart}>
                    <LineChart
                      points={trendPoints}
                      height={120}
                      lineColor={trendType === 'expense' ? colors.pink : colors.primary}
                      fillColor={trendType === 'expense' ? '#FCE7F3' : colors.mint}
                      labelIndexes={labelIndexes}
                      highlightIndex={highest?.index}
                      accessibilityLabel={`Tren ${
                        trendType === 'expense' ? 'pengeluaran' : 'pemasukan'
                      } harian ${formatMonthLabel(month)}.`}
                    />
                  </View>
                ) : (
                  <EmptyState
                    compact
                    icon={ReceiptText}
                    title={`Belum ada ${trendType === 'expense' ? 'pengeluaran' : 'pemasukan'}`}
                    description={`Tidak ada pergerakan ${
                      trendType === 'expense' ? 'uang keluar' : 'uang masuk'
                    } di bulan ${formatMonthLabel(month)}.`}
                  />
                )}
              </Card>
            </View>
          ) : null}

          {/* Section 3: Perbandingan Masuk vs Keluar */}
          <View style={styles.section}>
            <SectionTitle
              title="Perbandingan Masuk vs Keluar"
              subtitle={isAllTime ? 'Total akumulasi seluruh waktu' : formatMonthLabel(month)}
            />
            <Card style={styles.sectionCard}>
              <View>
                <View style={styles.flowHeader}>
                  <View style={styles.flowLabel}>
                    <View style={[styles.flowDot, { backgroundColor: colors.primary }]} />
                    <AppText variant="bodySm" weight="semiBold">
                      Masuk
                    </AppText>
                  </View>
                  <AppText variant="bodySm" weight="semiBold" tabular>
                    {formatRupiah(activeSummary.income)}
                  </AppText>
                </View>
                <View style={styles.flowTrack}>
                  <View
                    style={[
                      styles.flowFill,
                      { width: `${incomeWidth}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.flowSecondRow}>
                <View style={styles.flowHeader}>
                  <View style={styles.flowLabel}>
                    <View style={[styles.flowDot, { backgroundColor: colors.pink }]} />
                    <AppText variant="bodySm" weight="semiBold">
                      Keluar
                    </AppText>
                  </View>
                  <AppText variant="bodySm" weight="semiBold" tabular>
                    {formatRupiah(activeSummary.expense)}
                  </AppText>
                </View>
                <View style={styles.flowTrack}>
                  <View
                    style={[
                      styles.flowFill,
                      { width: `${expenseWidth}%`, backgroundColor: colors.pink },
                    ]}
                  />
                </View>
              </View>
            </Card>
          </View>
        </>
      )}
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 2,
  },
  timeframeSection: {
    marginTop: space.lg,
  },
  monthCard: {
    marginTop: space.md,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  monthCopy: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  monthLabel: {
    fontFamily: 'CalSans-Medium',
    textAlign: 'center',
  },
  allTimeCard: {
    marginTop: space.md,
    padding: space.lg,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    gap: 2,
  },
  empty: {
    marginTop: space.xl,
  },
  summaryCard: {
    marginTop: space.lg,
    padding: space.xxl,
    backgroundColor: colors.primary,
    borderRadius: radii.panel,
  },
  summaryAmount: {
    marginTop: space.md,
  },
  summaryTotals: {
    flexDirection: 'row',
    marginTop: space.xxl,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: colors.primaryActive,
  },
  summaryCell: {
    flex: 1,
    gap: 2,
  },
  summaryDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.primaryActive,
    paddingLeft: space.lg,
    marginLeft: space.lg,
  },
  summaryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  warningCard: {
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  warningDetail: {
    marginTop: space.sm,
  },
  section: {
    marginTop: space.xxl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  titleTextWrap: {
    flex: 1,
  },
  inlineSegment: {
    maxWidth: 160,
  },
  sectionTitle: {
    fontFamily: 'CalSans-Medium',
  },
  sectionCard: {
    marginTop: space.md,
  },
  donutWrap: {
    alignItems: 'center',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
    marginTop: space.xl,
  },
  legendItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    marginTop: 4,
    flexShrink: 0,
  },
  legendCopy: {
    flex: 1,
    minWidth: 0,
  },
  legendTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.xs,
  },
  legendName: {
    flex: 1,
    minWidth: 0,
  },
  metricRow: {
    flexDirection: 'row',
    gap: space.lg,
  },
  metricCell: {
    flex: 1,
    gap: 2,
  },
  metricDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.borderSubtle,
    paddingLeft: space.lg,
  },
  metricValue: {
    marginTop: space.xs,
  },
  chart: {
    marginTop: space.xl,
  },
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  flowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  flowDot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
  },
  flowTrack: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  flowFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  flowSecondRow: {
    marginTop: space.lg,
  },
});
