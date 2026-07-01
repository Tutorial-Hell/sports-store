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
  price,
  rating,
  sort,
}: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
  price?: string;
  rating?: string;
  sort?: string;
}) {
  // Query Filter
  const queryFilter =
    query && query !== 'all'
      ? { name: { contains: query, mode: 'insensitive' as const } }
      : {};

  // Category Filter
  const categoryFilter = category && category !== 'all' ? { category } : {};

  // Price Filter
  const priceFilter =
    price && price !== 'all'
      ? {
          price: {
            gte: Number(price.split('-')[0]),
            lte: Number(price.split('-')[1]),
          },
        }
      : {};

  // Rating Filter
  const ratingFilter =
    rating && rating !== 'all'
      ? {
          rating: {
            gte: Number(rating),
          },
        }
      : {};

  const where = {
    ...queryFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  };

  const data = await prisma.product.findMany({
    where,
    orderBy:
      sort === 'lowest'
        ? { price: 'asc' }
        : sort === 'highest'
          ? { price: 'desc' }
          : sort === 'rating'
            ? { rating: 'desc' }
            : { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const dataCount = await prisma.product.count({ where });

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

// Action to get all Categories
export async function getAllCategories() {
  const data = await prisma.product.groupBy({
    by: ['category'],
    _count: true,
  });

  return data;
}

// Action to get featured products
export async function getFeaturedProducts() {
  const data = await prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });
  return convertToPlainObject(data);
}
