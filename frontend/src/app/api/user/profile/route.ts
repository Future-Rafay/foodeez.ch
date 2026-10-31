import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authOptions, MIN_PASSWORD_LENGTH } from '@/lib/auth';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { firstName, lastName, currentPassword, newPassword } = await req.json();

    // Get the user from the database
    const user = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // If changing password, verify current password
    if (currentPassword && newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
          { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
          { status: 400 }
        );
      }
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.PASSWORD || ''
      );

      if (!isValidPassword) {
        return NextResponse.json(
          { message: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user with new password
      await prisma.visitors_account.update({
        where: { EMAIL_ADDRESS: session.user.email },
        data: {
          PASSWORD: hashedPassword,
          FIRST_NAME: firstName,
          LAST_NAME: lastName,
        },
      });
    } else {
      // Update user without changing password
      await prisma.visitors_account.update({
        where: { EMAIL_ADDRESS: session.user.email },
        data: {
          FIRST_NAME: firstName,
        LAST_NAME: lastName,
        },
      });
    }

    return NextResponse.json(
      { message: 'Profile updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 