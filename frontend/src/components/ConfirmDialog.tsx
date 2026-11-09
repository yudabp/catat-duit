import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { colors, radii, shadowRaised, space } from '@/theme/tokens';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  danger?: boolean;
  inline?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  description,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  destructive = true,
  danger,
  inline = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!visible) return null;

  const isDestructive = danger ?? destructive;
  const dialogMessage = description ?? message ?? '';

  const content = (
    <View
      style={inline ? styles.inlineOverlay : styles.overlay}
      accessibilityViewIsModal
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Tutup konfirmasi"
      />
      <View accessibilityRole="alert" style={styles.card}>
        <View
          style={[styles.iconWrap, isDestructive ? styles.iconDanger : styles.iconInfo]}
        >
          <TriangleAlert
            size={20}
            color={isDestructive ? colors.danger : colors.primary}
          />
        </View>
        <AppText variant="bodyLg" weight="medium" align="center" style={styles.title}>
          {title}
        </AppText>
        <AppText variant="bodySm" color={colors.textMuted} align="center">
          {dialogMessage}
        </AppText>
        <View style={styles.actions}>
          <Button
            label={cancelLabel}
            onPress={onCancel}
            variant="outline"
            size="sm"
            testID="confirm-dialog-cancel"
            style={styles.action}
          />
          <Button
            label={confirmLabel}
            onPress={onConfirm}
            variant={isDestructive ? 'danger' : 'primary'}
            size="sm"
            testID="confirm-dialog-confirm"
            style={styles.action}
          />
        </View>
      </View>
    </View>
  );

  if (inline) {
    return content;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxl,
  },
  inlineOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    backgroundColor: 'rgba(0, 31, 31, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.canvas,
    borderRadius: radii.card,
    padding: space.xxl,
    alignItems: 'center',
    ...shadowRaised,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDanger: {
    backgroundColor: colors.dangerSoft,
  },
  iconInfo: {
    backgroundColor: colors.mint,
  },
  title: {
    marginTop: space.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.xxl,
    width: '100%',
  },
  action: {
    flex: 1,
  },
});
