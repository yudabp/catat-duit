import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Package, Trash2, TrendingUp } from 'lucide-react-native';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Sheet } from '@/components/Sheet';
import { TextField } from '@/components/TextField';
import type { NewProductInput, Product } from '@/data/types';
import { colors, radii, space } from '@/theme/tokens';
import {
  formatAmountInput,
  formatRupiah,
  parseAmountInput,
} from '@/utils/format';

type ProductFormSheetProps = {
  visible: boolean;
  initial?: Product | null;
  onClose: () => void;
  onSave: (input: NewProductInput) => Promise<void>;
  onDelete?: (product: Product) => Promise<void>;
};

export function ProductFormSheet({
  visible,
  initial,
  onClose,
  onSave,
  onDelete,
}: ProductFormSheetProps) {
  const editing = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? '');
  const [cost, setCost] = useState(initial?.cost ?? 0);
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setCost(initial?.cost ?? 0);
      setPrice(initial?.price ?? 0);
      setStock(initial?.stock ?? 0);
      setError(null);
    }
  }, [visible, initial]);

  const profitPerUnit = price - cost;
  const marginPercent =
    cost > 0 ? Math.round((profitPerUnit / cost) * 100) : 0;

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nama produk wajib diisi.');
      return;
    }
    if (cost <= 0) {
      setError('Modal per pcs harus lebih dari Rp0.');
      return;
    }
    if (price <= 0) {
      setError('Harga jual per pcs harus lebih dari Rp0.');
      return;
    }

    setSaving(true);
    try {
      void Haptics.selectionAsync();
      await onSave({
        name: trimmedName,
        cost,
        price,
        stock: Math.max(0, stock),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan produk.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initial || !onDelete) return;
    setSaving(true);
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await onDelete(initial);
      setConfirmDelete(false);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet
        visible={visible}
        onClose={onClose}
        title={editing ? 'Ubah Produk' : 'Tambah Produk'}
        subtitle={
          editing
            ? 'Perbarui data modal, harga jual, atau stok.'
            : 'Catat produk baru untuk bisnis sampinganmu.'
        }
        footer={
          <View style={styles.footer}>
            {editing && onDelete ? (
              <Button
                label="Hapus"
                onPress={() => setConfirmDelete(true)}
                variant="ghost"
                size="md"
                icon={Trash2}
                style={styles.deleteBtn}
              />
            ) : null}
            <Button
              label={saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Produk'}
              onPress={() => void handleSave()}
              variant="primary"
              size="md"
              loading={saving}
              style={styles.saveBtn}
            />
          </View>
        }
      >
        <View style={styles.form}>
          <TextField
            label="Nama Produk"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError(null);
            }}
            placeholder="mis. Kaos Polos / Kopi Susu / Pulsa"
            autoCapitalize="words"
            left={<Package size={18} color={colors.textMuted} />}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <TextField
                label="Modal Beli / pcs"
                value={formatAmountInput(cost)}
                onChangeText={(text) => setCost(parseAmountInput(text))}
                placeholder="0"
                keyboardType="numeric"
                left={<AppText variant="labelSm" color={colors.textMuted}>Rp</AppText>}
              />
            </View>
            <View style={styles.col}>
              <TextField
                label="Harga Jual / pcs"
                value={formatAmountInput(price)}
                onChangeText={(text) => setPrice(parseAmountInput(text))}
                placeholder="0"
                keyboardType="numeric"
                left={<AppText variant="labelSm" color={colors.textMuted}>Rp</AppText>}
              />
            </View>
          </View>

          <TextField
            label="Jumlah Stok (pcs)"
            value={stock ? String(stock) : ''}
            onChangeText={(text) => {
              const num = parseInt(text.replace(/\D/g, ''), 10);
              setStock(isNaN(num) ? 0 : num);
            }}
            placeholder="0"
            keyboardType="numeric"
            hint="Berapa jumlah stok produk yang kamu miliki saat ini?"
          />

          {/* Estimasi Keuntungan Unit Card */}
          {cost > 0 && price > 0 ? (
            <View
              style={[
                styles.profitCard,
                profitPerUnit < 0 ? styles.profitCardLoss : null,
              ]}
            >
              <View style={styles.profitHeader}>
                <TrendingUp
                  size={16}
                  color={profitPerUnit >= 0 ? colors.accentMint : colors.accentRed}
                />
                <AppText
                  variant="labelSm"
                  weight="semiBold"
                  color={profitPerUnit >= 0 ? colors.accentMint : colors.accentRed}
                >
                  {profitPerUnit >= 0
                    ? `Estimasi Profit: ${formatRupiah(profitPerUnit)} / pcs (${marginPercent}%)`
                    : `Perhatian: Rugi ${formatRupiah(Math.abs(profitPerUnit))} / pcs`}
                </AppText>
              </View>
              <AppText variant="labelSm" color={colors.textMuted}>
                Modal {formatRupiah(cost)} → Jual {formatRupiah(price)}
                {stock > 0
                  ? ` · Total estimasi profit seluruh stok: ${formatRupiah(profitPerUnit * stock)}`
                  : ''}
              </AppText>
            </View>
          ) : null}

          {error ? (
            <AppText variant="labelSm" color={colors.accentRed} style={styles.errorText}>
              {error}
            </AppText>
          ) : null}
        </View>
      </Sheet>

      <ConfirmDialog
        visible={confirmDelete}
        title="Hapus Produk?"
        description={`Apakah kamu yakin ingin menghapus "${initial?.name}"? Data penjualan yang lalu tetap tersimpan di riwayat.`}
        confirmLabel="Hapus Produk"
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
        danger
      />
    </>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: space.lg,
    paddingTop: space.xs,
  },
  row: {
    flexDirection: 'row',
    gap: space.md,
  },
  col: {
    flex: 1,
  },
  profitCard: {
    padding: space.md,
    borderRadius: radii.card,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: space.xs,
  },
  profitCardLoss: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  profitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: space.md,
  },
  deleteBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
  errorText: {
    marginTop: space.xs,
  },
});
