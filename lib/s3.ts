import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// IDCloudHost S3 Storage config dengan default konkret prokick
const endpoint = process.env.S3_ENDPOINT || "https://is3.cloudhost.id";
const region = process.env.S3_REGION || "id-jkt-1";
const bucket = process.env.S3_BUCKET || "prokick";
const accessKeyId = process.env.S3_ACCESS_KEY || "";
const secretAccessKey = process.env.S3_SECRET_KEY || "";

const isS3Configured = Boolean(endpoint && accessKeyId && secretAccessKey);

const s3Client = isS3Configured
  ? new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    })
  : null;

export async function getReceiptUrl(key: string) {
  if (!s3Client || !isS3Configured || !key.startsWith("proofs/")) return key;
  return getSignedUrl(s3Client, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: "attachment" }), { expiresIn: 300 });
}

/**
 * Upload bukti bayar. Di produksi gagal = error (jangan simpan base64 ke DB).
 * Fallback data-URI hanya untuk dev tanpa kredensial.
 */
export async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  const key = `proofs/${Date.now()}-${fileName}`;

  if (s3Client && isS3Configured) {
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentDisposition: "attachment",
      }));
      return key;
    } catch (err) {
      console.error("S3 upload failed:", err);
      if (process.env.NODE_ENV === "production") {
        throw new Error("Gagal mengunggah bukti pembayaran ke object storage. Coba lagi atau hubungi admin.");
      }
    }
  } else if (process.env.NODE_ENV === "production") {
    throw new Error("Object storage belum dikonfigurasi (S3_ACCESS_KEY/S3_SECRET_KEY missing).");
  }

  // dev saja: tanpa S3, simpan sebagai data URI
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

/**
 * Upload foto produk ke path products/ (publik — tanpa ContentDisposition attachment).
 * Return: URL publik yang bisa langsung dipakai field `image` produk.
 */
export async function uploadProductImage(buffer: Buffer, fileName: string, contentType: string = "image/jpeg"): Promise<string> {
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const key = `products/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80)}.${ext}`;

  if (!s3Client || !isS3Configured) {
    throw new Error("Object storage belum dikonfigurasi (S3_ACCESS_KEY/S3_SECRET_KEY missing).");
  }

  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: "public-read",
  }));

  return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
}
