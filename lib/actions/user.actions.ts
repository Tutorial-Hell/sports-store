'use server';
import {
  signInFormSchema,
  signUpFormSchema,
  shippingAddressSchema,
  paymentMethodSchema,
  updateUserSchema,
} from '../validators';
import { ShippingAddress } from '@/types';
import { auth, signIn, signOut } from '@/auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { hashSync } from 'bcrypt-ts-edge';
import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import z from 'zod';
import { PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';

// action to sign in user
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData,
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });
    const callbackUrl = (formData.get('callbackUrl') as string) || '/';
    await signIn('credentials', { ...user, redirectTo: callbackUrl });

    return { success: true, message: 'Signed in Successfully' };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: 'Invalid email or password' };
  }
}

// action to sign user out
export async function signOutUser() {
  await signOut({ redirectTo: '/' });
}

// action to sign up user
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    const plainPassword = user.password;
    user.password = hashSync(user.password, 10);
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
    });
    await signIn('credentials', {
      email: user.email,
      password: plainPassword,
    });
    return { success: true, message: 'user registered successfully' };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: formatError(error) };
  }
}

// action to update user's shipping address
export async function updateUserAddress(data: ShippingAddress) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Not authenticated');

    const address = shippingAddressSchema.parse(data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { address },
    });

    return { success: true, message: 'Address updated successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// action to get user by ID
export async function getUserById(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  if (!user) throw new Error('User not found');
  return user;
}

// action to update user's payment method
export async function updateUserPaymentMethod(
  data: z.infer<typeof paymentMethodSchema>,
) {
  try {
    const session = await auth();
    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });
    if (!currentUser) throw new Error('User not found');

    const paymentMethod = paymentMethodSchema.parse(data);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { paymentMethod: paymentMethod.type },
    });
    return { success: true, message: 'User updated successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Action to update user profile
export async function updateProfile(user: { name: string; email: string }) {
  try {
    const session = await auth();
    const currentUser = await prisma.user.findFirst({
      where: {
        id: session?.user?.id,
      },
    });
    if (!currentUser) throw new Error('User not found');

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { name: user.name },
    });

    return { success: true, message: 'User sucessfully updated' };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Action to get all users
export async function getAllUsers({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  const queryFilter = query
    ? { name: { contains: query, mode: 'insensitive' as const } }
    : {};

  const data = await prisma.user.findMany({
    where: queryFilter,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.user.count({ where: queryFilter });

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Action to delete a user
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id: id } });

    revalidatePath('/admin/users');

    return { success: true, message: 'User successfully deleted' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Action to update a user
export async function updateUser(user: z.infer<typeof updateUserSchema>) {
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        role: user.role,
      },
    });
    revalidatePath('/admin/users');

    return { success: true, message: 'User successfully updated' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
