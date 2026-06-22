import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { S3Storage } from "@/lib/s3-storage";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_VIDEO_UPLOAD_SIZE_BYTES,
} from "@/lib/media";

const storage = new S3Storage();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
    );
    const isVideo = ALLOWED_VIDEO_TYPES.includes(
      file.type as (typeof ALLOWED_VIDEO_TYPES)[number]
    );

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only supported image and video formats are allowed." },
        { status: 400 }
      );
    }

    const maxSize = isVideo
      ? MAX_VIDEO_UPLOAD_SIZE_BYTES
      : MAX_UPLOAD_SIZE_BYTES;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File must be ${isVideo ? "50" : "10"} MB or smaller.` },
        { status: 400 }
      );
    }

    const stream = file.stream() as unknown as NodeJS.ReadableStream;

    const result = await storage.upload({
      filename: file.name,
      mimetype: file.type,
      stream,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("S3 upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
