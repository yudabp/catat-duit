import {
  adjustStock,
  createProduct,
  deleteProduct,
  deleteSale,
  recordSale,
  updateProduct,
} from '@/data/repository';
import { invalidateLocalData } from '@/data/query-keys';
import type {
  NewProductInput,
  NewSaleInput,
  Product,
  Sale,
  UpdateProductInput,
} from '@/data/types';

export async function addProduct(input: NewProductInput): Promise<Product> {
  const product = await createProduct(input);
  invalidateLocalData();
  return product;
}

export async function editProduct(
  id: string,
  input: UpdateProductInput,
): Promise<Product | null> {
  const product = await updateProduct(id, input);
  invalidateLocalData();
  return product;
}

export async function restockProduct(
  id: string,
  amount: number,
  newCost?: number,
): Promise<Product | null> {
  const product = await adjustStock(id, amount, newCost);
  invalidateLocalData();
  return product;
}

export async function removeProduct(id: string): Promise<void> {
  await deleteProduct(id);
  invalidateLocalData();
}

export async function addSale(input: NewSaleInput): Promise<Sale> {
  const sale = await recordSale(input);
  invalidateLocalData();
  return sale;
}

export async function removeSale(id: string): Promise<void> {
  await deleteSale(id, true);
  invalidateLocalData();
}
