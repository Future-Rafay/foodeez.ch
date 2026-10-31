import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import { S3Storage } from '@/lib/s3-storage';
import { Readable } from 'node:stream';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_SIZE_BYTES, formatFileSize } from '@/lib/media';

const s3Storage = new S3Storage();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return NextResponse.json({ error: 'Only PNG, JPEG, WebP, and GIF images are allowed.' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: `Image must be ${formatFileSize(MAX_UPLOAD_SIZE_BYTES)} or smaller.` }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Optimize image
    const optimizedBuffer = await sharp(buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const user = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: session.user.email },
      select: { PIC: true },
    });

    // Upload to S3
    const s3UploadResult = await s3Storage.upload({
      filename: file.name,
      mimetype: 'image/jpeg', // Force jpeg as we converted it
      stream: Readable.from(optimizedBuffer) as NodeJS.ReadableStream,
    });

    const imageUrl = s3UploadResult.url;

    // Update user profile in database
    await prisma.visitors_account.update({
      where: { EMAIL_ADDRESS: session.user.email },
      data: { PIC: imageUrl },
    });

    // Delete the old image only after the new one is saved, so a failure never leaves a broken avatar.
    if (user?.PIC && s3Storage.isManagedUrl(user.PIC)) {
      await s3Storage.delete(user.PIC).catch((error) =>
        console.error('Old profile image cleanup failed:', error)
      );
    }

    return NextResponse.json({ imageUrl, key: s3UploadResult.key });
  } catch (error) {
    console.error('Profile image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
} 