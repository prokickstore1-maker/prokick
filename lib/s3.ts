import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// IDCloudHost S3 Storage config dengan default fallback kredensial aman
const endpoint = process.env.S3_ENDPOINT || "https://is3.cloudhost.id";
const region = process.env.S3_REGION || "id-jkt-1";
const bucket = process.env.S3_BUCKET || "prokick";
const accessKeyId = process.env.S3_ACCESS_KEY || "1AGI99A7GVOO0GXP9DSS";
const secretAccessKey = process.env.S3_SECRET_KEY || "9zuKVG1gs87AEPJTVSc67yQC6QJawR0Z2a7vahFn";

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
 * Upload bukti bayar. Prioritaskan S3 object storage; jika terjadi kendala/error S3,
 * fallback ke data URI agar upload bukti customer tidak pernah gagal atau tertolak.
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
      console.error("S3 upload failed, falling back to base64 data-URI:", err);
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    }
  }

  console.warn("S3 is not configured, storing receipt as base64 data-URI.");
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
