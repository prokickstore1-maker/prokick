"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Copy,
  Check,
  UploadCloud,
  FileCheck,
  Truck,
  MessageCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoredOrder } from "@/lib/orders-store";
import { formatMYR } from "@/lib/utils";
import { uploadReceiptAction } from "@/app/actions/order";
import { orderStatusLabel } from "@/lib/order-status";

interface InvoiceViewProps {
  order: StoredOrder;
  waNumber: string;
}

export function InvoiceView({ order, waNumber }: InvoiceViewProps) {
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Upload States
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(order.paymentProofUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(Boolean(order.paymentProofUrl));
  const [uploadError, setUploadError] = useState("");

  const copyToClipboard = (text: string, type: "amount" | "account") => {
    navigator.clipboard.writeText(text);
    if (type === "amount") {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  /**
   * Client-side Canvas Image Compression
   * Resizes large phone receipts (3000px+) to max 1920px width/height and exports JPEG at 0.82 quality
   */
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 1920;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return reject(new Error("Canvas context unavailable"));
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error("Failed to load image into canvas"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setUploadError("");
    }
  };

  const handleUploadReceipt = async () => {
    if (!file) {
      setUploadError("Please choose a receipt screenshot to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      // 1. Client-Side Canvas Compression
      let base64Data: string;
      try {
        base64Data = await compressImage(file);
      } catch {
        setUploadError("Could not process this image. Please choose a different receipt screenshot.");
        setIsUploading(false);
        return;
      }

      // cek ukuran pra-submit: server tolak >1MB, jangan lempar error generik sesudah request
      const estimatedBytes = Math.ceil((base64Data.length - base64Data.indexOf(",") - 1) * 0.75);
      if (estimatedBytes > 1024 * 1024) {
        setUploadError("Receipt must be under 1 MB. Please retake a smaller photo.");
        setIsUploading(false);
        return;
      }

      // 2. Server Action to S3 and Database
      const result = await uploadReceiptAction(order.id, base64Data, "image/jpeg");

      if (!result.success) {
        setUploadError(result.error || "Upload failed. Please try again.");
        setIsUploading(false);
        return;
      }

      setUploadSuccess(true);
      setIsUploading(false);
    } catch (err) {
      console.error("Receipt upload error:", err);
      setUploadError("Upload failed. Please check your connection and try again, or contact admin.");
      setIsUploading(false);
    }
  };

  // Status Badge Colors — DESIGN.md §2: semantik saja (proses=cyan, terkirim/selesai=emerald, batal=muted)
  // label dari lib/order-status.ts: satu sumber dengan /track-order
  const statusColors: Record<string, string> = {
    PENDING_PAYMENT: "bg-zinc-500/15 text-zinc-300 border-zinc-500/40",
    PROCESSING: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
    SHIPPED: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
    COMPLETED: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
    CANCELLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  };
  const statusColor = statusColors[order.orderStatus] || statusColors.PENDING_PAYMENT;
  const statusLabel = orderStatusLabel(order.orderStatus);

  const isDuitNow = order.paymentMethodId?.includes("duitnow") || order.paymentMethodId === "qr-pay" || order.paymentMethodLabel?.includes("DuitNow") || order.paymentMethodLabel?.includes("QR");

  const waHelpMessage = encodeURIComponent(
    `Hello ProKick Admin! I have placed order #${order.orderNumber} for RM ${order.totalAmount}. Here is my query regarding payment/tracking.`
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-white">
      {/* Top Status Bar */}
      <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-6 sm:p-8 bg-[#121217] border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-300 font-bold">Invoice</span>
            <span className="text-xs text-zinc-500">&bull;</span>
            <span className="font-mono text-xs text-zinc-300 font-bold">
              {new Date(order.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-tight">
            Order #{order.orderNumber}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Courier Tracking Banner if Shipped */}
      {order.trackingNumber && (
        <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-5 bg-emerald-950/30 border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">Package Dispatched!</span>
              <span className="text-zinc-300">
                Courier Tracking Code: <strong className="text-white font-mono">{order.trackingNumber}</strong>
              </span>
            </div>
          </div>
          <Button asChild className="rounded-lg px-4 h-auto py-2 text-xs uppercase tracking-wider gap-1.5 self-start sm:self-auto font-extrabold">
            <a
              href={`https://www.pos.com.my/tracking?trackingNo=${order.trackingNumber}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Track Delivery</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
        </div>
      )}

      {/* Payment Instruction & Receipt Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: PAYMENT INSTRUCTIONS (QR PAY / BANK) */}
        <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-6 sm:p-8 bg-[#121217] border-white/10 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-bold text-white font-display uppercase tracking-wider">Payment Instructions</h2>
            <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-lg bg-white/10 text-zinc-300 border border-white/15">
              {order.paymentMethodLabel || "Instant DuitNow QR Pay"}
            </span>
          </div>

          {/* Exact Amount to Pay Box */}
          <div className="p-4 rounded-xl bg-[#09090B] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">Exact Amount to Pay</span>
              <span className="text-2xl font-black text-white font-mono">
                {formatMYR(order.totalAmount)}
              </span>
            </div>
            <Button
              variant="secondary"
              onClick={() => copyToClipboard(order.totalAmount, "amount")}
              className="rounded-xl p-2.5 gap-1.5 text-xs font-bold bg-white/10 text-white hover:bg-white/20 border-0"
            >
              {copiedAmount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span role="status">{copiedAmount ? "Copied!" : "Copy"}</span>
            </Button>
          </div>

          {/* QR View */}
          {isDuitNow ? (
            <div className="text-center space-y-3">
              {order.paymentQrImageUrl ? (
                <div className="inline-block p-4 rounded-2xl bg-white shadow-xl mx-auto border border-white/20">
                  {/* QR Code Box */}
                  <div className="w-48 h-48 relative flex items-center justify-center bg-white rounded-lg">
                    <Image
                      src={order.paymentQrImageUrl}
                      alt="DuitNow QR Code"
                      fill
                      className="object-contain p-2"
                      sizes="200px"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#09090B] border border-white/10 text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
                  QR image not available yet. Contact ProKick admin for the DuitNow QR, or use the bank transfer below.
                </div>
              )}
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Scan using <strong className="text-white">Maybank MAE</strong>, <strong className="text-white">CIMB OCTO</strong>, <strong className="text-white">Touch &apos;n Go eWallet</strong>, or any Malaysian banking app.
              </p>
            </div>
          ) : (
            /* Online Banking View */
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#09090B] border border-white/10 space-y-1">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Bank Name</span>
                <span className="font-bold text-white text-sm">
                  {order.paymentMethodLabel?.includes("CIMB") ? "CIMB Bank Berhad" : "Malayan Banking Berhad (Maybank)"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#09090B] border border-white/10 space-y-1">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Account Name</span>
                <span className="font-bold text-white">PROKICK MALAYSIA ENTERPRISE</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#09090B] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Account Number</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {order.paymentMethodLabel?.includes("CIMB") ? "8001 2345 6789" : "5140 1234 5678"}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    copyToClipboard(
                      order.paymentMethodLabel?.includes("CIMB") ? "800123456789" : "514012345678",
                      "account"
                    )
                  }
                  aria-label={copiedAccount ? "Account number copied" : "Copy account number"}
                  className="rounded-xl p-2 bg-white/10 text-white hover:bg-white/20 border-0"
                >
                  {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* CARD 2: PAYMENT SLIP UPLOAD WITH CANVAS COMPRESSION */}
        <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-6 sm:p-8 bg-[#121217] border-white/10 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h2 className="text-base font-bold text-white font-display uppercase tracking-wider">Payment Receipt</h2>
              <span role="status" className="text-[10px] text-volt font-semibold">
                {uploadSuccess ? "Receipt Received" : "Upload Slip"}
              </span>
            </div>

            {uploadError && (
              <div role="alert" className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess ? (
              <div className="p-6 rounded-2xl bg-[#09090B] border border-white/10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-sm">Receipt Successfully Uploaded!</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your payment receipt is being verified by the ProKick store administrator. You will receive a WhatsApp confirmation once shipped.
                </p>

                {previewUrl && (
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-white/10 mt-3">
                    <Image src={previewUrl} alt="Payment Receipt" fill className="object-cover" sizes="400px" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  After completing your transfer, take a screenshot of the receipt and upload it below. Our system will compress it automatically before sending to the admin.
                </p>

                {/* Upload Box */}
                <label className="border-2 border-dashed border-white/20 hover:border-volt rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#09090B]">
                  <UploadCloud className="w-8 h-8 text-volt mb-2" />
                  <span className="text-xs font-bold text-white block">
                    {file ? file.name : "Select Transfer Receipt Screenshot"}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                    PNG, JPEG, WebP &bull; Max 1MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {previewUrl && (
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-white/10">
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" sizes="400px" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            {!uploadSuccess && (
              <Button
                onClick={handleUploadReceipt}
                disabled={!file || isUploading}
                className="w-full h-auto rounded-full px-6 py-4 text-xs uppercase tracking-wider font-bold shadow-lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compressing &amp; Uploading Slip...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Submit Payment Receipt</span>
                  </>
                )}
              </Button>
            )}

            {/* WhatsApp Confirmation Link */}
            <Button asChild variant="outline" className="w-full h-auto rounded-xl px-4 py-3 text-xs font-bold gap-2 bg-white/5 text-white border-white/10 hover:bg-white/10 hover:text-white">
              <a
                href={`https://wa.me/${waNumber}?text=${waHelpMessage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Chat Admin on WhatsApp</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Itemized Order Breakdown */}
      <div className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-6 sm:p-8 bg-[#121217] border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white font-display uppercase tracking-wider border-b border-white/10 pb-3">
          Ordered Football Kits
        </h2>

        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-xl bg-[#09090B] border border-white/8 text-xs"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-white font-display">{item.name}</span>
                <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                  <span>Size: <strong className="text-white font-mono">{item.size}</strong></span>
                  <span>&bull;</span>
                  <span>Qty: {item.quantity}</span>
                </div>
                {item.namesetName && (
                  <p className="text-[10px] text-zinc-400 font-semibold">
                    Nameset: {item.namesetName} #{item.namesetNumber || "0"}
                  </p>
                )}
                {item.patch && (
                  <p className="text-[10px] text-zinc-400 font-semibold">
                    Patch: {item.patch}
                  </p>
                )}
              </div>

              <div className="text-right font-mono font-bold text-white">
                {formatMYR(parseFloat(item.unitPrice) * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-400 gap-2">
          <span>Recipient Address: <strong className="text-white">{order.customerAddress}</strong></span>
          <Link href="/jersey" className="text-volt font-bold hover:underline">
            Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
