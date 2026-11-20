import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

export interface UploadResult {
  key: string;
  url: string;
}

const bucket = process.env.S3_BUCKET!;
const region = process.env.S3_REGION || "us-east-1";
const accessKeyId = process.env.S3_ACCESS_KEY!;
const secretAccessKey = process.env.S3_SECRET_KEY!;
const forcePathStyle =
  String(process.env.S3_FORCE_PATH_STYLE || "false") === "true";

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

/** The stored extension follows the checked type, never the file name the browser sent ("tool.exe"). */
export const extensionForType = (mimetype: string) => EXTENSIONS[mimetype] ?? "bin";

/**
 * Review and story media must be files this app uploaded, or links already saved on the record being
 * edited. Any other link can point at outside content, and a host next/image does not know makes the
 * page throw for every visitor.
 */
export const areUploadedMediaUrls = (
  values: unknown[],
  alreadySaved: (string | null | undefined)[] = []
) =>
  values.every(
    (value) =>
      value == null ||
      value === "" ||
      (typeof value === "string" &&
        (value.startsWith(`https://${bucket}.s3.${region}.amazonaws.com/uploads/`) || alreadySaved.includes(value)))
  );

function streamToNodeReadable(stream: NodeJS.ReadableStream): Readable {
  return stream as Readable;
}

export class S3Storage {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle,
    });
  }

  toPublicUrl(keyOrUrl: string) {
    if (/^https?:\/\//i.test(keyOrUrl)) return keyOrUrl;
    return `https://${bucket}.s3.${region}.amazonaws.com/${keyOrUrl}`;
  }

  isManagedUrl(keyOrUrl: string) {
    if (!keyOrUrl) return false;
    if (!/^https?:\/\//i.test(keyOrUrl)) return true;
    return keyOrUrl.startsWith(
      `https://${bucket}.s3.${region}.amazonaws.com/`
    );
  }

  async upload({
    filename,
    mimetype,
    stream,
  }: {
    filename: string;
    mimetype: string;
    stream: NodeJS.ReadableStream;
  }): Promise<UploadResult> {
    const ext = extensionForType(mimetype);
    const base = path
      .basename(filename, path.extname(filename))
      .replace(/[^a-zA-Z0-9-_]/g, "");
    const key = `uploads/${Date.now()}-${randomUUID()}-${
      base || "file"
    }.${ext}`;

    const uploader = new Upload({
      client: this.client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: streamToNodeReadable(stream),
        ContentType: mimetype,
      },
    });

    await uploader.done();

    return {
      key,
      url: this.toPublicUrl(key),
    };
  }

  async delete(keyOrUrl: string) {
    if (!this.isManagedUrl(keyOrUrl)) return;

    const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`;
    const key = /^https?:\/\//i.test(keyOrUrl)
      ? keyOrUrl.replace(prefix, "")
      : keyOrUrl;

    if (!key) return;

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  }
}
