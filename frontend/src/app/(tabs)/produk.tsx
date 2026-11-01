import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  AlertTriangle,
  CheckCircle2,
  Package,
  PackagePlus,
  Plus,
  ShoppingBag,
  Trash2,
  TrendingUp,
  XCircle,
} from 'lucide-react-native';
import { AppScaffold } from '@/components/AppScaffold';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useToast } from '@/components/Toast';
import {
  addProduct,
  addSale,
  editProduct,
  removeProduct,
  removeSale,
  restockProduct,
} from '@/features/products/actions';
import { ProductFormSheet } from '@/features/products/ProductFormSheet';
import { RestockSheet } from '@/features/products/RestockSheet';
import { SaleFormSheet } from '@/features/products/SaleFormSheet';
import {
  useInventorySummary,
  useProducts,
  useSales,
} from '@/hooks/useData';
import type {
  NewProductInput,
  NewSaleInput,
  Product,
  Sale,
} from '@/data/types';
import { colors, radii, shadow, space } from '@/theme/tokens';
import { formatDateLong } from '@/utils/date';
import { formatRupiah } from '@/utils/format';

type ActiveTab = 'products' | 'sales';

export default function ProdukScreen() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');

  // Modals & Sheets
  const [productFormVisible, setProductFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saleFormVisible, setSaleFormVisible] = useState(false);
  const [saleProductId, setSaleProductId] = useState<string | null>(null);
  const [restockVisible, setRestockVisible] = useState(false);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  // Queries
  const { data: products = [] } = useProducts();
  const { data: sales = [] } = useSales(100);
  const { data: summary } = useInventorySummary();

  const totalProfit = summary?.totalRealizedProfit ?? 0;
  const totalStock = summary?.totalStockUnits ?? 0;
  const totalCapital = summary?.totalCapitalValue ?? 0;
  const totalSalesRevenue = summary?.totalSalesRevenue ?? 0;

  // Handlers for Products
  const handleSaveProduct = async (input: NewProductInput) => {
    if (editingProduct) {
      await editProduct(editingProduct.id, input);
      showToast({
        title: 'Produk diperbarui',
        detail: `${input.name} · Modal ${formatRupiah(input.cost)}`,
      });
    } else {
      await addProduct(input);
      showToast({
        title: 'Produk ditambahkan',
        detail: `${input.name} · Stok awal ${input.stock ?? 0} pcs`,
      });
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (product: Product) => {
    await removeProduct(product.id);
    showToast({
      title: 'Produk dihapus',
      detail: product.name,
    });
    setEditingProduct(null);
  };

  // Handlers for Sales
  const handleRecordSale = async (input: NewSaleInput) => {
    const sale = await addSale(input);
    showToast({
      title: 'Penjualan dicatat!',
      detail: `${sale.productName} (${sale.quantity} pcs) · Untung ${formatRupiah(sale.totalProfit)}`,
    });
  };

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    await removeSale(saleToDelete.id);
    showToast({
      title: 'Penjualan dibatalkan',
      detail: `Stok ${saleToDelete.productName} dikembalikan (+${saleToDelete.quantity} pcs)`,
    });
    setSaleToDelete(null);
  };

  // Handlers for Restock
  const handleRestock = async (
    id: string,
    additionalStock: number,
    newCost?: number,
  ) => {
    await restockProduct(id, additionalStock);
    if (newCost !== undefined) {
      await editProduct(id, { cost: newCost });
    }
    showToast({
      title: 'Stok berhasil ditambah',
      detail: `+${additionalStock} pcs produk berhasil ditambahkan ke stok`,
    });
    setRestockTarget(null);
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductFormVisible(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormVisible(true);
  };

  const openSaleForProduct = (productId?: string) => {
    setSaleProductId(productId ?? null);
    setSaleFormVisible(true);
  };

  const openRestock = (product: Product) => {
    setRestockTarget(product);
    setRestockVisible(true);
  };

  return (
    <AppScaffold>
      {/* Eyebrow & Header */}
      <View style={styles.header}>
        <AppText
          variant="labelSm"
          weight="medium"
          color={colors.textSubtle}
          style={styles.eyebrow}
        >
          BISNIS & INVENTARIS
        </AppText>
        <AppText variant="headingSm" style={styles.title}>
          Bisnis & Penjualan
        </AppText>
        <AppText variant="bodySm" color={colors.textMuted}>
          Kelola stok produk, catat transaksi penjualan, dan pantau keuntungan bersih.
        </AppText>
      </View>

      {/* Ringkasan Bisnis (Dashboard Card) */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <AppText variant="labelSm" color={colors.textMuted}>
              TOTAL KEUNTUNGAN BERSIH (PROFIT)
            </AppText>
            <AppText
              variant="headingLg"
              weight="bold"
              color={totalProfit >= 0 ? colors.accentMint : colors.accentRed}
              tabular
            >
              {formatRupiah(totalProfit)}
            </AppText>
          </View>
          <View style={styles.profitIconBadge}>
            <TrendingUp size={22} color={colors.accentMint} />
          </View>
        </View>

        <View style={styles.metricsList}>
          <View style={styles.metricRow}>
            <AppText variant="bodySm" color={colors.textMuted}>
              Total Sisa Stok
            </AppText>
            <AppText variant="bodyMd" weight="bold" tabular>
              {totalStock} pcs
            </AppText>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricRow}>
            <AppText variant="bodySm" color={colors.textMuted}>
              Modal Tertahan (Stok)
            </AppText>
            <AppText variant="bodyMd" weight="semiBold" tabular>
              {formatRupiah(totalCapital)}
            </AppText>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricRow}>
            <AppText variant="bodySm" color={colors.textMuted}>
              Total Omset Penjualan
            </AppText>
            <AppText variant="bodyMd" weight="semiBold" tabular>
              {formatRupiah(totalSalesRevenue)}
            </AppText>
          </View>
        </View>
      </Card>

      {/* Tombol Aksi Cepat */}
      <View style={styles.actionRow}>
        <Button
          label="Catat Penjualan"
          onPress={() => openSaleForProduct()}
          variant="primary"
          size="md"
          icon={ShoppingBag}
          style={styles.actionBtn}
          disabled={products.length === 0}
        />
        <Button
          label="Tambah Produk"
          onPress={openNewProduct}
          variant="secondary"
          size="md"
          icon={Plus}
          style={styles.actionBtn}
        />
      </View>

      {/* Segmented Control: Stok vs Riwayat Penjualan */}
      <View style={styles.tabSection}>
        <SegmentedControl
          label="Pilih tampilan produk atau penjualan"
          value={activeTab}
          onChange={(tab) => {
            void Haptics.selectionAsync();
            setActiveTab(tab as ActiveTab);
          }}
          options={[
            {
              value: 'products',
              label: `Stok Produk (${products.length})`,
            },
            {
              value: 'sales',
              label: `Riwayat Penjualan (${sales.length})`,
            },
          ]}
        />
      </View>

      {/* Konten Tab 1: Daftar Produk */}
      {activeTab === 'products' ? (
        <View style={styles.contentList}>
          {products.length > 0 ? (
            products.map((product) => {
              const profitPerUnit = product.price - product.cost;
              const margin =
                product.cost > 0
                  ? Math.round((profitPerUnit / product.cost) * 100)
                  : 0;
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= 5;

              return (
                <Card key={product.id} style={styles.productCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.productInfo}>
                      <AppText variant="bodyLg" weight="bold">
                        {product.name}
                      </AppText>
                      <View style={styles.priceRow}>
                        <AppText variant="labelSm" color={colors.textMuted}>
                          Beli: {formatRupiah(product.cost)}
                        </AppText>
                        <AppText variant="labelSm" color={colors.textSubtle}>
                          ·
                        </AppText>
                        <AppText variant="labelSm" weight="medium">
                          Jual: {formatRupiah(product.price)}
                        </AppText>
                        <AppText variant="labelSm" color={colors.textSubtle}>
                          ·
                        </AppText>
                        <AppText
                          variant="labelSm"
                          weight="semiBold"
                          color={colors.accentMint}
                        >
                          Untung +{formatRupiah(profitPerUnit)} ({margin}%)
                        </AppText>
                      </View>
                    </View>

                    {/* Stock Status Badge */}
                    <View
                      style={[
                        styles.stockBadge,
                        isOutOfStock
                          ? styles.stockBadgeOut
                          : isLowStock
                            ? styles.stockBadgeLow
                            : styles.stockBadgeOk,
                      ]}
                    >
                      {isOutOfStock ? (
                        <XCircle size={14} color={colors.accentRed} />
                      ) : isLowStock ? (
                        <AlertTriangle size={14} color="#D97706" />
                      ) : (
                        <CheckCircle2 size={14} color={colors.accentMint} />
                      )}
                      <AppText
                        variant="labelSm"
                        weight="bold"
                        color={
                          isOutOfStock
                            ? colors.accentRed
                            : isLowStock
                              ? '#D97706'
                              : colors.accentMint
                        }
                      >
                        {isOutOfStock ? 'Habis' : `${product.stock} pcs`}
                      </AppText>
                    </View>
                  </View>

                  {/* Tombol Aksi Produk */}
                  <View style={styles.cardActions}>
                    <Button
                      label="Jual"
                      onPress={() => openSaleForProduct(product.id)}
                      variant="primary"
                      size="sm"
                      icon={ShoppingBag}
                      disabled={isOutOfStock}
                      style={styles.cardBtn}
                    />
                    <Button
                      label="+ Stok"
                      onPress={() => openRestock(product)}
                      variant="secondary"
                      size="sm"
                      icon={PackagePlus}
                      style={styles.cardBtn}
                    />
                    <Button
                      label="Ubah"
                      onPress={() => openEditProduct(product)}
                      variant="ghost"
                      size="sm"
                      style={styles.cardBtnSmall}
                    />
                  </View>
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon={Package}
              title="Belum ada produk"
              description="Tambahkan produk pertama yang kamu jual, lengkap dengan modal dan harga jualnya."
              actionLabel="Tambah Produk Sekarang"
              onAction={openNewProduct}
            />
          )}
        </View>
      ) : null}

      {/* Konten Tab 2: Riwayat Penjualan */}
      {activeTab === 'sales' ? (
        <View style={styles.contentList}>
          {sales.length > 0 ? (
            sales.map((sale) => (
              <Card key={sale.id} style={styles.saleCard}>
                <View style={styles.saleHeader}>
                  <View style={styles.saleInfo}>
                    <AppText variant="bodyMd" weight="bold">
                      {sale.productName}
                    </AppText>
                    <AppText variant="labelSm" color={colors.textMuted}>
                      {formatDateLong(sale.saleDate)} · {sale.quantity} pcs @ {formatRupiah(sale.pricePerUnit)}
                    </AppText>
                    {sale.note ? (
                      <AppText
                        variant="labelSm"
                        color={colors.textSubtle}
                        style={styles.saleNote}
                      >
                        Catatan: {sale.note}
                      </AppText>
                    ) : null}
                  </View>

                  <View style={styles.saleFinancials}>
                    <AppText variant="bodyMd" weight="bold" tabular>
                      {formatRupiah(sale.totalPrice)}
                    </AppText>
                    <View style={styles.profitPill}>
                      <AppText
                        variant="labelSm"
                        weight="bold"
                        color={colors.accentMint}
                        tabular
                      >
                        +{formatRupiah(sale.totalProfit)}
                      </AppText>
                    </View>
                  </View>
                </View>

                <View style={styles.saleFooter}>
                  <AppText variant="labelSm" color={colors.textSubtle}>
                    Modal: {formatRupiah(sale.costPerUnit * sale.quantity)} (@ {formatRupiah(sale.costPerUnit)})
                  </AppText>
                  <Pressable
                    onPress={() => setSaleToDelete(sale)}
                    hitSlop={8}
                    style={styles.deleteSaleBtn}
                  >
                    <Trash2 size={14} color={colors.textMuted} />
                    <AppText variant="labelSm" color={colors.textMuted}>
                      Batal
                    </AppText>
                  </Pressable>
                </View>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="Belum ada riwayat penjualan"
              description="Catatan pesanan dan keuntungan penjualan akan tampil rapi di sini setelah kamu mencatat penjualan."
              actionLabel="Catat Penjualan Sekarang"
              onAction={() => openSaleForProduct()}
            />
          )}
        </View>
      ) : null}

      {/* Form Tambah/Ubah Produk */}
      <ProductFormSheet
        visible={productFormVisible}
        initial={editingProduct}
        onClose={() => {
          setProductFormVisible(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
      />

      {/* Form Penjualan */}
      <SaleFormSheet
        visible={saleFormVisible}
        products={products}
        initialProductId={saleProductId}
        onClose={() => {
          setSaleFormVisible(false);
          setSaleProductId(null);
        }}
        onSave={handleRecordSale}
      />

      {/* Form Restock Tambah Stok */}
      <RestockSheet
        visible={restockVisible}
        product={restockTarget}
        onClose={() => {
          setRestockVisible(false);
          setRestockTarget(null);
        }}
        onSave={handleRestock}
      />

      {/* Dialog Konfirmasi Batal Penjualan */}
      <ConfirmDialog
        visible={Boolean(saleToDelete)}
        title="Batalkan Penjualan Ini?"
        description={`Apakah kamu ingin membatalkan penjualan ${saleToDelete?.quantity} pcs "${saleToDelete?.productName}"? Stok produk akan otomatis dikembalikan.`}
        confirmLabel="Ya, Batalkan Penjualan"
        onConfirm={() => void handleDeleteSale()}
        onCancel={() => setSaleToDelete(null)}
        danger
      />
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: space.xs,
  },
  eyebrow: {
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 2,
  },
  summaryCard: {
    marginTop: space.xl,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    padding: space.xl,
    ...shadow,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  profitIconBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsList: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: space.sm,
    gap: space.xs,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.xs,
  },
  metricDivider: {
    height: 1,
    backgroundColor: colors.surfaceSubtle,
  },
  actionRow: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.xl,
  },
  actionBtn: {
    flex: 1,
  },
  tabSection: {
    marginTop: space.xl,
    marginBottom: space.md,
  },
  contentList: {
    gap: space.md,
    paddingBottom: space.xxl,
  },
  productCard: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    padding: space.lg,
    gap: space.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
  },
  productInfo: {
    flex: 1,
    gap: space.xs,
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.xs,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  stockBadgeOk: {
    backgroundColor: '#ECFDF5',
  },
  stockBadgeLow: {
    backgroundColor: '#FFFBEB',
  },
  stockBadgeOut: {
    backgroundColor: '#FEF2F2',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: space.sm,
  },
  cardBtn: {
    flex: 2,
  },
  cardBtnSmall: {
    flex: 1,
  },
  saleCard: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    padding: space.lg,
    gap: space.sm,
  },
  saleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  saleInfo: {
    flex: 1,
    gap: 2,
  },
  saleNote: {
    marginTop: 2,
  },
  saleFinancials: {
    alignItems: 'flex-end',
    gap: 2,
  },
  profitPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  saleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: space.sm,
    marginTop: space.xs,
  },
  deleteSaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
