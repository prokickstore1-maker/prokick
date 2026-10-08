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
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const trustedReceiptHost = (() => {
  try {
    return new URL(process.env.S3_ENDPOINT || "https://is3.cloudhost.id").hostname;
  } catch {
    return "";
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
    const receiptUrl = safeReceiptUrl(data.paymentProofUrl);
    const cleanPhone = data.customerPhone.replace(/[^0-9]/g, "");
    const waLink = `https://wa.me/${cleanPhone.startsWith("60") ? cleanPhone : "60" + cleanPhone}`;

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
<b>WhatsApp:</b> <a href="${waLink}">+${cleanPhone}</a>
<b>Shipping Zone:</b> ${escapeHtml(data.shippingZone)}
<b>Address:</b> ${escapeHtml(data.customerAddress)}

<b>Ordered Kits:</b>
${itemsListHtml}

━━━━━━━━━━━━━━━━━━━━━━
<b>Total Paid:</b> <b>${escapeHtml(data.totalAmount)}</b>
<b>Payment Method:</b> ${escapeHtml(data.paymentMethod)}
<b>Receipt Slip:</b> ${receiptUrl ? `<a href="${escapeHtml(receiptUrl)}">View Payment Slip</a>` : "Pending upload"}
`.trim();

    // Send photo with caption if receipt URL is an HTTP link
    if (receiptUrl) {
      const photoUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
      await fetch(photoUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: receiptUrl,
          caption: messageHtml,
          parse_mode: "HTML",
        }),
      });
    } else {
      // Send message
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
