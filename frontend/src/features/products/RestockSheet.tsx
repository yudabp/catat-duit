import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PackagePlus } from 'lucide-react-native';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { TextField } from '@/components/TextField';
import type { Product } from '@/data/types';
import { colors, radii, space } from '@/theme/tokens';
import {
  formatAmountInput,
  parseAmountInput,
} from '@/utils/format';

type RestockSheetProps = {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (id: string, additionalStock: number, newCost?: number) => Promise<void>;
};

export function RestockSheet({
  visible,
  product,
  onClose,
  onSave,
}: RestockSheetProps) {
  const [amount, setAmount] = useState<number>(10);
  const [cost, setCost] = useState<number>(product?.cost ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && product) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(10);
      setCost(product.cost);
      setError(null);
    }
  }, [visible, product]);

  const currentStock = product?.stock ?? 0;
  const newTotalStock = currentStock + amount;

  const handleSave = async () => {
    if (!product) return;
    if (amount <= 0) {
      setError('Jumlah restock minimal 1 pcs.');
      return;
    }

    setSaving(true);
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onSave(
        product.id,
        amount,
        cost !== product.cost ? cost : undefined,
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah stok.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Tambah Stok (Restock)"
      subtitle={`Kulakan atau tambah stok untuk ${product?.name ?? ''}.`}
      footer={
        <Button
          label={saving ? 'Menyimpan...' : 'Tambah Stok Sekarang'}
          onPress={() => void handleSave()}
          variant="primary"
          size="md"
          loading={saving}
          disabled={!product || amount <= 0}
        />
      }
    >
      <View style={styles.form}>
        <View style={styles.infoBox}>
          <AppText variant="bodySm" color={colors.textMuted}>
            Stok saat ini:
          </AppText>
          <AppText variant="headingSm" weight="bold">
            {currentStock} pcs
          </AppText>
        </View>

        <TextField
          label="Jumlah Tambahan Stok (pcs)"
          value={amount ? String(amount) : ''}
          onChangeText={(text) => {
            const num = parseInt(text.replace(/\D/g, ''), 10);
            setAmount(isNaN(num) ? 0 : num);
          }}
          placeholder="0"
          keyboardType="numeric"
          left={<PackagePlus size={18} color={colors.primary} />}
          hint={`Total stok akan menjadi ${newTotalStock} pcs`}
        />

        <TextField
          label="Modal Beli Terbaru per pcs"
          value={formatAmountInput(cost)}
          onChangeText={(text) => setCost(parseAmountInput(text))}
          placeholder="0"
          keyboardType="numeric"
          left={<AppText variant="labelSm" color={colors.textMuted}>Rp</AppText>}
          hint="Ubah jika ada perubahan harga dari distributor atau grosir."
        />

        {error ? (
          <AppText variant="labelSm" color={colors.accentRed}>
            {error}
          </AppText>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: space.lg,
    paddingTop: space.xs,
  },
  infoBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.card,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
