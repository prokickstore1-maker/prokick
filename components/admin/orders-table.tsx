"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  Truck,
  Eye,
  MessageCircle,
  Loader2,
  ExternalLink,
  XCircle,
} from "lucide-react";
import { StoredOrder } from "@/lib/orders-store";
import { formatIDR, toIntlPhone } from "@/lib/utils";
import { updateOrderAdminNotesAction, updateOrderStatusAction } from "@/app/actions/order";
import { JNT_COURIER } from "@/lib/indonesia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrdersTableProps {
  initialOrders: StoredOrder[];
}

// Catatan admin per order: blur = simpan, indikator status di sampingnya.
function OrderNotesInput({ orderId, initial }: { orderId: string; initial: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSaved, setLastSaved] = useState(initial);

  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <Input
        defaultValue={initial}
        placeholder="Catatan admin"
        aria-label="Catatan admin"
        disabled={status === "saving"}
        onBlur={async (e) => {
          const v = e.target.value.trim();
          if (v === lastSaved) return;
          setStatus("saving");
          const r = await updateOrderAdminNotesAction(orderId, v);
          if (!r.success) {
            alert(r.error || "Gagal menyimpan catatan.");
            e.target.value = lastSaved;
            setStatus("idle");
            return;
          }
          setLastSaved(v);
          setStatus("saved");
          setTimeout(() => setStatus("idle"), 2000);
        }}
        className="h-9 rounded-lg px-2 text-[11px] sm:h-7"
      />
      {status === "saving" && <Loader2 className="w-3 h-3 animate-spin text-zinc-400 shrink-0" />}
      {status === "saved" && <span className="text-[10px] text-emerald-400 font-bold shrink-0">✓ Tersimpan</span>}
    </div>
  );
}

export function OrdersTable({ initialOrders }: OrdersTableProps) {
  const [orders, setOrders] = useState<StoredOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Tracking Modal State
  const [trackingModalOrder, setTrackingModalOrder] = useState<StoredOrder | null>(null);
  const [courierName, setCourierName] = useState("J&T Express");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PROCESSING") return o.orderStatus === "PROCESSING";
    if (activeTab === "SHIPPED") return o.orderStatus === "SHIPPED";
    if (activeTab === "COMPLETED") return o.orderStatus === "COMPLETED";
    return true;
  });

  const handleConfirmPaid = async (orderId: string) => {
    setIsUpdating(true);
    await updateOrderStatusAction(orderId, "PROCESSING");
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "PAID", orderStatus: "PROCESSING" } : o))
    );
    setIsUpdating(false);
  };

  const handleSaveTracking = async () => {
    if (!trackingModalOrder || !trackingNumber.trim()) return;

    setIsUpdating(true);
    const trackingCode = `${courierName}: ${trackingNumber.trim()}`;
    await updateOrderStatusAction(trackingModalOrder.id, "SHIPPED", trackingCode);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === trackingModalOrder.id
          ? { ...o, orderStatus: "SHIPPED", trackingNumber: trackingCode }
          : o
      )
    );

    setIsUpdating(false);
    setTrackingModalOrder(null);
    setTrackingNumber("");
  };

  const handleMarkCompleted = async (orderId: string) => {
    setIsUpdating(true);
    await updateOrderStatusAction(orderId, "COMPLETED");
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: "COMPLETED" } : o))
    );
    setIsUpdating(false);
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm("Batalkan order ini? Stok akan dikembalikan.")) return;
    setIsUpdating(true);
    const r = await updateOrderStatusAction(orderId, "CANCELLED");
    if (!r.success) {
      alert(r.error || "Gagal membatalkan order.");
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: "CANCELLED", paymentStatus: "PENDING" } : o))
      );
    }
    setIsUpdating(false);
  };

  return (
    <div className="space-y-6 text-[#FAFAFA]">
      {/* Status Filter Tabs (Clean Nike Pills) */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-[#27272A] bg-transparent p-0 pb-2">
          {[
            { key: "ALL", label: `All Orders (${orders.length})` },
            { key: "PROCESSING", label: `Processing (${orders.filter((o) => o.orderStatus === "PROCESSING").length})` },
            { key: "SHIPPED", label: `Shipped (${orders.filter((o) => o.orderStatus === "SHIPPED").length})` },
            { key: "COMPLETED", label: `Completed (${orders.filter((o) => o.orderStatus === "COMPLETED").length})` },
          ].map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="rounded-lg px-4 py-2 text-xs font-bold whitespace-nowrap data-[state=active]:bg-volt data-[state=active]:text-black"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Mobile: kartu order — tabel 7 kolom tak mungkin dibaca di HP */}
      <div className="grid gap-3 sm:hidden">
        {filteredOrders.length === 0 && (
          <p className="rounded-xl border border-[#27272A] bg-[#121217] p-4 text-center text-sm text-zinc-400">
            Belum ada order di tab ini.
          </p>
        )}
        {filteredOrders.map((order) => {
          const waUrl = `https://wa.me/${toIntlPhone(order.customerPhone)}`;
          return (
            <div key={order.id} className="rounded-xl border border-[#27272A] bg-[#121217] p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/invoice/${order.id}`} className="font-mono font-bold text-white text-sm inline-flex items-center gap-1">
                    <span>#{order.orderNumber}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </Link>
                  <span className="block text-[10px] text-zinc-500 font-mono mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                    order.orderStatus === "SHIPPED" || order.orderStatus === "COMPLETED"
                      ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/30"
                      : order.orderStatus === "PROCESSING"
                      ? "bg-cyan-400/20 text-cyan-300 border-cyan-400/30"
                      : order.orderStatus === "CANCELLED"
                      ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                      : "bg-zinc-500/15 text-zinc-300 border-zinc-500/40"
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#27272A] pt-3">
                <div className="min-w-0">
                  <span className="block font-bold text-white text-sm truncate">{order.customerName}</span>
                  <span className="block text-[10px] text-zinc-500 truncate">{order.shippingZone}</span>
                </div>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 min-h-11 min-w-11 flex items-center justify-center rounded-lg border border-emerald-800 bg-emerald-950/60 text-emerald-300 active:bg-emerald-900"
                  title={`Chat WhatsApp ${order.customerPhone}`}
                  aria-label={`Chat WhatsApp ${order.customerName}`}
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-black text-white text-base">{formatIDR(order.totalAmount)}</span>
                <div className="flex items-center gap-1.5">
                  {order.paymentProofUrl ? (
                    <button
                      onClick={() => setSelectedReceipt(order.paymentProofUrl!)}
                      className="min-h-9 rounded-lg border border-[#27272A] bg-[#181820] px-2.5 text-[11px] font-bold text-zinc-200 inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Slip
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono font-semibold">Pending Slip</span>
                  )}
                </div>
              </div>

              {order.items.map((i, idx) => (
                <div key={idx} className="text-[11px] text-zinc-300">
                  <span className="font-semibold">{i.quantity}× {i.name} ({i.size})</span>
                  {i.namesetName && <span className="block text-[10px] text-emerald-400 font-mono">Nameset: {i.namesetName} #{i.namesetNumber}</span>}
                  {i.patch && <span className="block text-[10px] text-zinc-400 font-mono truncate">Patch: {i.patch}</span>}
                </div>
              ))}

              {order.trackingNumber && (
                <p className="text-[10px] font-mono text-zinc-300 border-t border-[#27272A] pt-2">{order.trackingNumber}</p>
              )}

              <OrderNotesInput key={order.id} orderId={order.id} initial={order.adminNotes || ""} />

              <div className="flex flex-wrap gap-2 border-t border-[#27272A] pt-3">
                {order.orderStatus === "PENDING_PAYMENT" && (
                  <Button
                    onClick={() => handleConfirmPaid(order.id)}
                    disabled={isUpdating}
                    className="flex-1 h-auto min-h-11 rounded-lg bg-emerald-600 px-3 text-xs font-bold hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm Paid</span>
                  </Button>
                )}
                {order.orderStatus === "PROCESSING" && (
                  <Button
                    onClick={() => { setTrackingModalOrder(order); setTrackingNumber(""); }}
                    className="flex-1 h-auto min-h-11 rounded-lg px-3 text-xs font-bold"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Add Tracking</span>
                  </Button>
                )}
                {order.orderStatus === "SHIPPED" && (
                  <Button
                    onClick={() => handleMarkCompleted(order.id)}
                    disabled={isUpdating}
                    className="flex-1 h-auto min-h-11 rounded-lg px-3 text-xs font-bold"
                  >
                    Mark Completed
                  </Button>
                )}
                {(order.orderStatus === "PENDING_PAYMENT" || order.orderStatus === "PROCESSING") && (
                  <Button
                    onClick={() => handleCancel(order.id)}
                    disabled={isUpdating}
                    variant="outline"
                    className="flex-1 h-auto min-h-11 rounded-lg border-[#7F1D1D] bg-[#450A0A] px-3 text-xs font-bold text-red-300 hover:bg-[#7F1D1D] hover:text-red-200"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Batalkan</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Orders Table Container (desktop) */}
      <div className="hidden sm:block rounded-2xl bg-[#121217] border border-[#27272A] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table className="text-xs text-zinc-400">
            <TableHeader className="bg-[#181820] text-white uppercase tracking-wider text-[10px] font-bold border-b border-[#27272A]">
              <TableRow className="hover:bg-transparent border-[#27272A]">
                <TableHead className="p-4">Order Number &amp; Date</TableHead>
                <TableHead className="p-4">Customer Info</TableHead>
                <TableHead className="p-4">Kits &amp; Customization</TableHead>
                <TableHead className="p-4">Total (IDR)</TableHead>
                <TableHead className="p-4">Payment &amp; Slip</TableHead>
                <TableHead className="p-4">Status &amp; Courier</TableHead>
                <TableHead className="p-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-medium text-white">
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-8 text-center text-xs text-zinc-400">
                    No orders found under this tab.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const waUrl = `https://wa.me/${toIntlPhone(order.customerPhone)}`;

                  return (
                    <TableRow key={order.id} className="hover:bg-[#181820] transition-colors border-[#27272A]">
                      {/* Order Info */}
                      <TableCell className="p-4">
                        <Link
                          href={`/invoice/${order.id}`}
                          className="font-mono font-bold text-white hover:text-zinc-400 flex items-center gap-1"
                        >
                          <span>#{order.orderNumber}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </Link>
                        <span className="text-[10px] text-zinc-400 block mt-0.5 font-mono">
                          {new Date(order.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="p-4">
                        <span className="font-bold text-white block">{order.customerName}</span>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:underline text-[11px] font-mono mt-0.5"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>{order.customerPhone}</span>
                        </a>
                        <span className="text-[10px] text-zinc-400 block truncate max-w-[180px]">
                          {order.shippingZone}
                        </span>
                      </TableCell>

                      {/* Kits summary */}
                      <TableCell className="p-4">
                        <div className="space-y-1 max-w-[200px]">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="text-[11px]">
                              <span className="text-white font-semibold">
                                {i.quantity}× {i.name} ({i.size})
                              </span>
                              {i.namesetName && (
                                <span className="block text-[10px] text-emerald-400 font-mono">
                                  Nameset: {i.namesetName} #{i.namesetNumber}
                                </span>
                              )}
                              {i.patch && (
                                <span className="block text-[10px] text-white font-mono truncate">
                                  Patch: {i.patch}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>

                      {/* Total */}
                      <TableCell className="p-4 font-mono font-black text-white text-sm">
                        {formatIDR(order.totalAmount)}
                      </TableCell>

                      {/* Payment & Receipt */}
                      <TableCell className="p-4">
                        <span className="text-[11px] text-white block font-semibold">
                          {order.paymentMethodLabel || "QRIS / Transfer"}
                        </span>
                        {order.paymentProofUrl ? (
                          <Button
                            onClick={() => setSelectedReceipt(order.paymentProofUrl!)}
                            className="mt-1 h-auto rounded-lg px-2.5 py-1 text-[10px] font-bold"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Slip</span>
                          </Button>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-mono block mt-1 font-semibold">
                            Pending Slip
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg inline-block border ${
                            order.orderStatus === "SHIPPED" || order.orderStatus === "COMPLETED"
                              ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/30"
                              : order.orderStatus === "PROCESSING"
                              ? "bg-cyan-400/20 text-cyan-300 border-cyan-400/30"
                              : order.orderStatus === "CANCELLED"
                              ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                              : "bg-zinc-500/15 text-zinc-300 border-zinc-500/40"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                        {order.trackingNumber && (
                          <span className="text-[10px] font-mono text-white block mt-1 truncate max-w-[140px] font-semibold">
                            {order.trackingNumber}
                          </span>
                        )}
                        <OrderNotesInput key={order.id} orderId={order.id} initial={order.adminNotes || ""} />
                      </TableCell>

                      {/* Action buttons */}
                      <TableCell className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {order.orderStatus === "PENDING_PAYMENT" && (
                          <Button
                            onClick={() => handleConfirmPaid(order.id)}
                            disabled={isUpdating}
                            className="h-auto rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold hover:bg-emerald-700"
                            title="Confirm Payment"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Confirm Paid</span>
                          </Button>
                        )}

                        {order.orderStatus === "PROCESSING" && (
                          <Button
                            onClick={() => {
                              setTrackingModalOrder(order);
                              setTrackingNumber("");
                            }}
                            className="h-auto rounded-lg px-3 py-1.5 text-xs font-bold"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Add Tracking</span>
                          </Button>
                        )}

                        {(order.orderStatus === "PENDING_PAYMENT" || order.orderStatus === "PROCESSING") && (
                          <Button
                            onClick={() => handleCancel(order.id)}
                            disabled={isUpdating}
                            variant="outline"
                            className="h-auto rounded-lg border-[#7F1D1D] bg-[#450A0A] px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-[#7F1D1D] hover:text-red-200"
                            title="Batalkan order (stok dikembalikan)"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Batalkan</span>
                          </Button>
                        )}

                        {order.orderStatus === "SHIPPED" && (
                          <Button
                            onClick={() => handleMarkCompleted(order.id)}
                            disabled={isUpdating}
                            className="h-auto rounded-lg px-3 py-1.5 text-xs font-bold"
                          >
                            Mark Completed
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ==========================================================================
          MODAL 1: RECEIPT SLIP VIEWER
          ========================================================================== */}
      <Dialog open={Boolean(selectedReceipt)} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-w-lg rounded-3xl border-[#27272A] p-6">
          <DialogHeader className="border-b border-[#27272A] pb-3">
            <DialogTitle className="text-sm font-bold text-white font-display uppercase tracking-wider">
              Customer Payment Slip
            </DialogTitle>
          </DialogHeader>

          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#27272A] bg-[#181820]">
            <Image
              src={selectedReceipt || ""}
              alt="Payment Slip Proof"
              fill
              className="object-contain"
              sizes="500px"
            />
          </div>

          <div className="flex justify-end">
            <Button className="h-auto rounded-lg px-5 py-2 text-xs font-bold uppercase tracking-wider" onClick={() => setSelectedReceipt(null)}>
              Close Slip
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==========================================================================
          MODAL 2: ADD COURIER TRACKING
          ========================================================================== */}
      <Dialog open={Boolean(trackingModalOrder)} onOpenChange={(open) => !open && setTrackingModalOrder(null)}>
        <DialogContent className="max-w-md rounded-3xl border-[#27272A] p-6">
          <DialogHeader className="border-b border-[#27272A] pb-3">
            <DialogTitle className="text-sm font-bold text-white font-display uppercase tracking-wider">
              Dispatch Order #{trackingModalOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="courier" className="text-xs font-bold text-zinc-400">
                Kurir
              </Label>
              <Select value={courierName} onValueChange={setCourierName}>
                <SelectTrigger id="courier" className="w-full rounded-xl border-[#27272A] text-xs font-medium focus-visible:border-volt">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={JNT_COURIER.name}>{JNT_COURIER.name}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="trackingNumber" className="text-xs font-bold text-zinc-400">
                Tracking Code / Consignment Note No.
              </Label>
              <Input
                id="trackingNumber"
                type="text"
                placeholder="e.g. JT1234567890"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="rounded-xl border-[#27272A] font-mono text-xs font-bold focus-visible:border-volt"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#27272A] pt-2">
            <Button variant="outline" className="h-auto rounded-lg border-[#27272A] bg-[#181820] px-4 py-2 text-xs font-bold text-white hover:bg-[#27272A] hover:text-white" onClick={() => setTrackingModalOrder(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTracking}
              disabled={!trackingNumber.trim() || isUpdating}
              className="h-auto rounded-lg px-5 py-2 text-xs font-bold uppercase tracking-wider"
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
              <span>Set as Dispatched</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
