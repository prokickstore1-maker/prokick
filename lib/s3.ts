import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT || "https://is3.cloudhost.id";
const region = process.env.S3_REGION || "id-jkt-1";
const bucket = process.env.S3_BUCKET || "prokick-store";
const accessKeyId = process.env.S3_ACCESS_KEY || "";
const secretAccessKey = process.env.S3_SECRET_KEY || "";

const isS3Configured = Boolean(accessKeyId && secretAccessKey);

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
 * Falls back gracefully in local dev if credentials are not configured yet
 */
export async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  const key = `proofs/${Date.now()}-${fileName}`;

  if (s3Client && isS3Configured) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentDisposition: "attachment",
      });

      await s3Client.send(command);
      return key;
    } catch (err) {
      console.warn("S3 upload failed, using fallback:", err);
    }
  }

  // Graceful dev fallback: return data URI
  const base64 = buffer.toString("base64");
  return `data:${contentType};base64,${base64}`;
}
