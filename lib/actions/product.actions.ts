'use server';
import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError } from '../utils';
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { insertProductSchema, updateProductSchema } from '../validators';
import { z } from 'zod';

// Get Latest Product
export async function getLatestProducts() {
  const data = await prisma.product.findMany({
    take: LATEST_PRODUCTS_LIMIT,
    orderBy: { createdAt: 'desc' },
  });
  return convertToPlainObject(data);
}

// Get single product from slug
export async function getProductBySlug(slug: string) {
  return await prisma.product.findFirst({
    where: { slug: slug },
  });
}

// Action to get product by id
export async function getProductById(productId: string) {
  const data = await prisma.product.findFirst({
    where: { id: productId },
  });
  return convertToPlainObject(data);
}

// Action to get all products
export async function getAllProducts({
  query,
  limit = PAGE_SIZE,
  page,
  category,
}: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
}) {
  const queryFilter = query
    ? { name: { contains: query, mode: 'insensitive' as const } }
    : {};

  const data = await prisma.product.findMany({
    where: queryFilter,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const dataCount = await prisma.product.count({ where: queryFilter });

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Action to delete a product
export async function deleteProduct(id: string) {
  try {
    const productExists = await prisma.product.findFirst({
      where: { id },
    });

    if (!productExists) throw new Error('Product not found');

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath('/admin/products');

    return { success: true, message: 'Product successfully deleted' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Action to Create Product
export async function createProduct(data: z.infer<typeof insertProductSchema>) {
  try {
    const product = insertProductSchema.parse(data);
    await prisma.product.create({ data: product });

    revalidatePath('/admin/products');
    return { success: true, message: 'Product Created Successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Action to Update Product
export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
  try {
    const product = updateProductSchema.parse(data);
    const productExists = await prisma.product.findFirst({
      where: { id: product.id },
    });

    if (!productExists) throw new Error('Product not found');

    await prisma.product.update({
      where: { id: product.id },
      data: product,
    });

    revalidatePath('/admin/products');
    return { success: true, message: 'Product Updated Successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
