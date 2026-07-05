'use server';
import z from 'zod';
import { insertReviewSchema } from '../validators';
import { formatError } from '../utils';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { revalidatePath } from 'next/cache';

// Create and update reviews
export async function createUpdateReview(
  data: z.infer<typeof insertReviewSchema>,
) {
  try {
    const session = await auth();
    if (!session) {
      throw new Error('User id not authenticated');
    }

    // Validate and store the review
    const review = insertReviewSchema.parse({
      ...data,
      userId: session?.user?.id,
    });

    // Get product being reviewed
    const product = await prisma.product.findFirst({
      where: { id: review.productId },
    });
    if (!product) throw new Error('Product not found');

    // Check if user already reviewed product
    const reviewExists = await prisma.review.findFirst({
      where: {
        productId: review.productId,
        userId: review.userId,
      },
    });

    await prisma.$transaction(async (tx) => {
      const hasPurchased = !!(await tx.order.findFirst({
        where: {
          userId: review.userId,
          isPaid: true,
          orderitems: { some: { productId: review.productId } },
        },
      }));

      if (reviewExists) {
        // update review
        await tx.review.update({
          where: { id: reviewExists.id },
          data: {
            title: review.title,
            description: review.description,
            rating: review.rating,
            isVerifiedPurchase: hasPurchased,
          },
        });
      } else {
        // create review
        await tx.review.create({
          data: { ...review, isVerifiedPurchase: hasPurchased },
        });
      }

      // Get average rating
      const averageRating = await tx.review.aggregate({
        _avg: { rating: true },
        where: { productId: review.productId },
      });

      // Get number of reviews
      const numReviews = await tx.review.count({
        where: { productId: review.productId },
      });

      // Update rating and num reviews in product table
      await tx.product.update({
        where: { id: review.productId },
        data: {
          rating: averageRating._avg.rating || 0,
          numReviews,
        },
      });
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: 'Review Updated Successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Action to get all reviews for product
export async function getReviews({ productId }: { productId: string }) {
  const data = await prisma.review.findMany({
    where: { productId: productId },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return { data };
}

// Action to get review by current user
export async function getReviewByProductId({
  productId,
}: {
  productId: string;
}) {
  const session = await auth();

  if (!session) throw new Error('User is not authenticated');

  return await prisma.review.findFirst({
    where: { productId, userId: session?.user?.id },
  });
}
