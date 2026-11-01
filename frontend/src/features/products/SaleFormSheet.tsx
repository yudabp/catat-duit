import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  CalendarDays,
  Check,
  Minus,
  Plus,
  TrendingUp,
} from 'lucide-react-native';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { DatePickerModal } from '@/components/DatePickerModal';
import { Sheet } from '@/components/Sheet';
import { TextField } from '@/components/TextField';
import type { NewSaleInput, Product } from '@/data/types';
import { colors, radii, space } from '@/theme/tokens';
import { formatDateLong, todayISO } from '@/utils/date';
import {
  formatAmountInput,
  formatRupiah,
  parseAmountInput,
} from '@/utils/format';

type SaleFormSheetProps = {
  visible: boolean;
  products: Product[];
  initialProductId?: string | null;
  onClose: () => void;
  onSave: (input: NewSaleInput) => Promise<void>;
};

export function SaleFormSheet({
  visible,
  products,
  initialProductId,
  onClose,
  onSave,
}: SaleFormSheetProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(todayISO());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [recordAsIncome, setRecordAsIncome] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) ?? products[0];

  useEffect(() => {
    if (visible) {
      const target =
        products.find((p) => p.id === initialProductId) ?? products[0];
      if (target) {
        setSelectedProductId(target.id);
        setCustomPrice(target.price);
      }
      setQuantity(1);
      setNote('');
      setSaleDate(todayISO());
      setRecordAsIncome(true);
      setError(null);
    }
  }, [visible, initialProductId, products]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setCustomPrice(product.price);
    setError(null);
    void Haptics.selectionAsync();
  };

  const unitCost = selectedProduct?.cost ?? 0;
  const unitPrice = customPrice > 0 ? customPrice : (selectedProduct?.price ?? 0);
  const totalRevenue = unitPrice * quantity;
  const totalCost = unitCost * quantity;
  const totalProfit = totalRevenue - totalCost;
  const remainingStock = (selectedProduct?.stock ?? 0) - quantity;

  const handleSave = async () => {
    if (!selectedProduct) {
      setError('Pilih produk yang terjual.');
      return;
    }
    if (quantity <= 0) {
      setError('Jumlah harus minimal 1 pcs.');
      return;
    }
    if (selectedProduct.stock < quantity) {
      setError(
        `Stok ${selectedProduct.name} tidak cukup (tersedia ${selectedProduct.stock} pcs).`,
      );
      return;
    }

    setSaving(true);
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onSave({
        productId: selectedProduct.id,
        quantity,
        pricePerUnit: unitPrice,
        note: note.trim() || undefined,
        saleDate,
        recordAsIncome,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat penjualan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet
        visible={visible}
        onClose={onClose}
        title="Catat Penjualan"
        subtitle="Kurangi stok dan hitung keuntungan penjualan secara otomatis."
        footer={
          <Button
            label={saving ? 'Menyimpan...' : 'Simpan Penjualan'}
            onPress={() => void handleSave()}
            variant="primary"
            size="md"
            loading={saving}
            disabled={!selectedProduct || selectedProduct.stock < quantity}
          />
        }
      >
        <View style={styles.form}>
          {/* Pilih Produk */}
          <View>
            <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
              PILIH PRODUK TERJUAL
            </AppText>
            <View style={styles.chipRow}>
              {products.map((p) => {
                const selected = p.id === (selectedProduct?.id ?? '');
                return (
                  <Chip
                    key={p.id}
                    label={`${p.name} (sisa ${p.stock})`}
                    selected={selected}
                    onPress={() => handleSelectProduct(p)}
                  />
                );
              })}
            </View>
          </View>

          {/* Input Jumlah Pcs */}
          <View style={styles.qtySection}>
            <View style={styles.qtyLabelWrap}>
              <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
                JUMLAH TERJUAL (PCS)
              </AppText>
              <AppText variant="labelSm" color={colors.textSubtle}>
                Sisa stok saat ini: {selectedProduct?.stock ?? 0} pcs
              </AppText>
            </View>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setQuantity((prev) => Math.max(1, prev - 1));
                }}
                style={styles.stepperBtn}
                accessibilityLabel="Kurangi jumlah"
              >
                <Minus size={16} color={colors.text} />
              </Pressable>
              <TextInput
                style={styles.qtyInput}
                value={String(quantity || '')}
                onChangeText={(text) => {
                  const val = parseInt(text.replace(/\D/g, ''), 10);
                  setQuantity(isNaN(val) ? 0 : val);
                }}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setQuantity((prev) =>
                    Math.min(selectedProduct?.stock ?? 9999, prev + 1),
                  );
                }}
                style={styles.stepperBtn}
                accessibilityLabel="Tambah jumlah"
              >
                <Plus size={16} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Harga Jual per pcs */}
          <TextField
            label="Harga Jual Satuan"
            value={formatAmountInput(customPrice)}
            onChangeText={(text) => setCustomPrice(parseAmountInput(text))}
            placeholder="0"
            keyboardType="numeric"
            left={<AppText variant="labelSm" color={colors.textMuted}>Rp</AppText>}
            hint={
              selectedProduct
                ? `Modal beli: ${formatRupiah(selectedProduct.cost)} / pcs`
                : undefined
            }
          />

          {/* Tanggal Penjualan */}
          <View>
            <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
              TANGGAL TRANSAKSI
            </AppText>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={styles.datePickerBtn}
            >
              <CalendarDays size={18} color={colors.primary} />
              <AppText variant="bodyMd" weight="medium">
                {formatDateLong(saleDate)}
              </AppText>
            </Pressable>
          </View>

          {/* Catatan / Keterangan */}
          <TextField
            label="Catatan Pembeli (Opsional)"
            value={note}
            onChangeText={setNote}
            placeholder="mis. Pembeli Mas Agus (COD) / No HP 0812..."
          />

          {/* Toggle Catat Otomatis ke Transaksi Pemasukan */}
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setRecordAsIncome(!recordAsIncome);
            }}
            style={styles.toggleRow}
          >
            <View
              style={[
                styles.checkbox,
                recordAsIncome ? styles.checkboxActive : null,
              ]}
            >
              {recordAsIncome ? <Check size={14} color="#FFF" /> : null}
            </View>
            <View style={styles.toggleText}>
              <AppText variant="bodySm" weight="medium">
                Catat ke Pemasukan Catat Duit
              </AppText>
              <AppText variant="labelSm" color={colors.textMuted}>
                Otomatis menambahkan omset ({formatRupiah(totalRevenue)}) ke catatan uang masuk utama.
              </AppText>
            </View>
          </Pressable>

          {/* Ringkasan Profit Realtime */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <AppText variant="bodySm" color={colors.textMuted}>
                Total Omset ({quantity} pcs × {formatRupiah(unitPrice)}):
              </AppText>
              <AppText variant="bodySm" weight="semiBold" tabular>
                {formatRupiah(totalRevenue)}
              </AppText>
            </View>

            <View style={styles.summaryRow}>
              <AppText variant="bodySm" color={colors.textMuted}>
                Total Modal ({quantity} pcs × {formatRupiah(unitCost)}):
              </AppText>
              <AppText variant="bodySm" color={colors.textMuted} tabular>
                {formatRupiah(totalCost)}
              </AppText>
            </View>

            <View style={styles.divider} />

            <View style={styles.profitBlock}>
              <View style={styles.profitBadge}>
                <TrendingUp size={16} color={colors.accentMint} />
                <AppText variant="bodySm" weight="bold" color={colors.accentMint}>
                  Keuntungan Bersih (Profit)
                </AppText>
              </View>
              <AppText
                variant="headingMd"
                weight="bold"
                color={totalProfit >= 0 ? colors.accentMint : colors.accentRed}
                tabular
                style={styles.profitAmount}
              >
                {formatRupiah(totalProfit)}
              </AppText>
            </View>

            <View style={styles.stockStatus}>
              <AppText variant="labelSm" color={colors.textSubtle}>
                Sisa stok setelah penjualan: {Math.max(0, remainingStock)} pcs
              </AppText>
            </View>
          </View>

          {error ? (
            <AppText variant="labelSm" color={colors.accentRed}>
              {error}
            </AppText>
          ) : null}
        </View>
      </Sheet>

      <DatePickerModal
        visible={showDatePicker}
        selectedDate={saleDate}
        onSelect={(date) => {
          setSaleDate(date);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: space.lg,
    paddingTop: space.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
  },
  qtySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: space.md,
    borderRadius: radii.card,
    gap: space.sm,
  },
  qtyLabelWrap: {
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    minWidth: 52,
    height: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.canvas,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: space.xs,
    paddingVertical: 0,
  },
  qtyText: {
    minWidth: 28,
    textAlign: 'center',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.input,
    padding: space.md,
    marginTop: space.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    padding: space.lg,
    gap: space.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: space.xs,
  },
  profitBlock: {
    gap: 4,
    paddingVertical: 2,
  },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  profitAmount: {
    fontSize: 22,
    lineHeight: 28,
  },
  stockStatus: {
    marginTop: space.xs,
  },
});
