import { toIntlPhone } from "@/lib/utils";

export interface TelegramOrderNotification {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  shippingZone: string;
  items: Array<{
    name: string;
    size: string;
    quantity: number;
    nameset?: string;
    patch?: string;
  }>;
  totalAmount: string;
  paymentMethod: string;
  paymentProofUrl?: string;
  paymentProofBuffer?: Buffer;
  paymentProofMime?: string;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const trustedReceiptHost = (() => {
  try {
    return new URL(process.env.S3_ENDPOINT || "https://is3.cloudhost.id").hostname;
  } catch {
    return "is3.cloudhost.id";
  }
})();

function safeReceiptUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === trustedReceiptHost ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Dispatches an order alert to Admin Telegram Bot
 */
export async function sendTelegramNotification(data: TelegramOrderNotification): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("Telegram credentials are not configured. Skipping notification.");
    return false;
  }

  try {
    // 1. Ekstrak buffer foto langsung (dari upload baru atau fallback base64 data URI)
    let photoBuffer = data.paymentProofBuffer;
    let photoMime = data.paymentProofMime || "image/jpeg";
    if (!photoBuffer && data.paymentProofUrl?.startsWith("data:image/")) {
      const match = data.paymentProofUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        photoMime = match[1];
        photoBuffer = Buffer.from(match[2], "base64");
      }
    }

    const receiptUrl = safeReceiptUrl(data.paymentProofUrl);
    const intlPhone = toIntlPhone(data.customerPhone);
    const waLink = `https://wa.me/${intlPhone}`;

    const itemsListHtml = data.items
      .map(
        (i, idx) =>
          `<b>${idx + 1}. ${escapeHtml(i.name)}</b> (Size: <code>${escapeHtml(i.size)}</code>, Qty: ${i.quantity})` +
          (i.nameset ? `\n   <i>Nameset: ${escapeHtml(i.nameset)}</i>` : "") +
          (i.patch ? `\n   <i>Patch: ${escapeHtml(i.patch)}</i>` : "")
      )
      .join("\n");

    const messageHtml = `
<b>New order received, ProKick</b>
━━━━━━━━━━━━━━━━━━━━━━
<b>Order Number:</b> <code>#${escapeHtml(data.orderNumber)}</code>
<b>Customer:</b> ${escapeHtml(data.customerName)}
<b>WhatsApp:</b> <a href="${waLink}">+${intlPhone}</a>
<b>Shipping Zone:</b> ${escapeHtml(data.shippingZone)}
<b>Address:</b> ${escapeHtml(data.customerAddress)}

<b>Ordered Kits:</b>
${itemsListHtml}

━━━━━━━━━━━━━━━━━━━━━━
<b>Total Paid:</b> <b>${escapeHtml(data.totalAmount)}</b>
<b>Payment Method:</b> ${escapeHtml(data.paymentMethod)}
<b>Receipt Slip:</b> ${photoBuffer ? "✅ Bukti pembayaran terlampir" : receiptUrl ? `<a href="${escapeHtml(receiptUrl)}">View Payment Slip</a>` : "Pending upload"}
`.trim();

    let photoSent = false;

    // Prioritas 1: Kirim foto langsung via multipart/form-data (paling handal, tidak tergantung fetch S3 pihak ketiga)
    if (photoBuffer && photoBuffer.length > 0) {
      try {
        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("caption", messageHtml);
        formData.append("parse_mode", "HTML");
        const ext = photoMime.includes("png") ? "png" : photoMime.includes("webp") ? "webp" : "jpg";
        formData.append("photo", new File([new Uint8Array(photoBuffer)], `receipt-${data.orderNumber}.${ext}`, { type: photoMime }));

        const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          body: formData,
        });
        const resJson = await res.json();
        if (resJson.ok) {
          photoSent = true;
        } else {
          console.warn("Telegram multipart sendPhoto failed:", resJson);
        }
      } catch (err) {
        console.warn("Telegram sendPhoto buffer error:", err);
      }
    }

    // Prioritas 2: Kirim foto via URL publik S3 jika belum terkirim
    if (!photoSent && receiptUrl) {
      try {
        const photoUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
        const res = await fetch(photoUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            photo: receiptUrl,
            caption: messageHtml,
            parse_mode: "HTML",
          }),
        });
        const resJson = await res.json();
        if (resJson.ok) {
          photoSent = true;
        } else {
          console.warn("Telegram URL sendPhoto failed:", resJson);
        }
      } catch (err) {
        console.warn("Telegram URL sendPhoto error:", err);
      }
    }

    // Fallback: Kirim pesan teks jika tidak ada foto atau pengiriman foto gagal
    if (!photoSent) {
      const textUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      await fetch(textUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageHtml,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
      });
    }

    console.log(`Telegram alert sent for order #${data.orderNumber}`);
    return true;
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
    return false;
  }
}
