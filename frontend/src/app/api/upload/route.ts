import { NextRequest, NextResponse } from "next/server";
import { S3Storage } from "@/lib/s3-storage";

const storage = new S3Storage();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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
