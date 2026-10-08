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
} from "lucide-react";
import { StoredOrder } from "@/lib/orders-store";
import { formatMYR } from "@/lib/utils";
import { updateOrderStatusAction } from "@/app/actions/order";
import { MALAYSIAN_COURIERS } from "@/lib/malaysia";
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

export function OrdersTable({ initialOrders }: OrdersTableProps) {
  const [orders, setOrders] = useState<StoredOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Tracking Modal State
  const [trackingModalOrder, setTrackingModalOrder] = useState<StoredOrder | null>(null);
  const [courierName, setCourierName] = useState("Pos Laju");
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

  return (
    <div className="space-y-6 text-[#0C0A09]">
      {/* Status Filter Tabs (Clean Nike Pills) */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-[#E5E5E5] bg-transparent p-0 pb-2">
          {[
            { key: "ALL", label: `All Orders (${orders.length})` },
            { key: "PROCESSING", label: `Processing (${orders.filter((o) => o.orderStatus === "PROCESSING").length})` },
            { key: "SHIPPED", label: `Shipped (${orders.filter((o) => o.orderStatus === "SHIPPED").length})` },
            { key: "COMPLETED", label: `Completed (${orders.filter((o) => o.orderStatus === "COMPLETED").length})` },
          ].map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="rounded-lg px-4 py-2 text-xs font-bold whitespace-nowrap data-[state=active]:bg-black data-[state=active]:text-white"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Orders Table Container */}
      <div className="rounded-2xl bg-white border border-[#E5E5E5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table className="text-xs text-[#57534E]">
            <TableHeader className="bg-[#FAFAF9] text-black uppercase tracking-wider text-[10px] font-bold border-b border-[#E5E5E5]">
              <TableRow className="hover:bg-transparent border-[#E5E5E5]">
                <TableHead className="p-4">Order Number &amp; Date</TableHead>
                <TableHead className="p-4">Customer Info</TableHead>
                <TableHead className="p-4">Kits &amp; Customization</TableHead>
                <TableHead className="p-4">Total (MYR)</TableHead>
                <TableHead className="p-4">Payment &amp; Slip</TableHead>
                <TableHead className="p-4">Status &amp; Courier</TableHead>
                <TableHead className="p-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-medium text-black">
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-8 text-center text-xs text-[#57534E]">
                    No orders found under this tab.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, "");
                  const waUrl = `https://wa.me/${cleanPhone.startsWith("60") ? cleanPhone : "60" + cleanPhone}`;

                  return (
                    <TableRow key={order.id} className="hover:bg-[#F9F9F9] transition-colors border-[#E5E5E5]">
                      {/* Order Info */}
                      <TableCell className="p-4">
                        <Link
                          href={`/invoice/${order.id}`}
                          className="font-mono font-bold text-black hover:text-[#57534E] flex items-center gap-1"
                        >
                          <span>#{order.orderNumber}</span>
                          <ExternalLink className="w-3 h-3 text-[#57534E]" />
                        </Link>
                        <span className="text-[10px] text-[#57534E] block mt-0.5 font-mono">
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
                        <span className="font-bold text-black block">{order.customerName}</span>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#16A34A] hover:underline text-[11px] font-mono mt-0.5"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>{order.customerPhone}</span>
                        </a>
                        <span className="text-[10px] text-[#57534E] block truncate max-w-[180px]">
                          {order.shippingZone}
                        </span>
                      </TableCell>

                      {/* Kits summary */}
                      <TableCell className="p-4">
                        <div className="space-y-1 max-w-[200px]">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="text-[11px]">
                              <span className="text-black font-semibold">
                                {i.quantity}× {i.name} ({i.size})
                              </span>
                              {i.namesetName && (
                                <span className="block text-[10px] text-[#16A34A] font-mono">
                                  Nameset: {i.namesetName} #{i.namesetNumber}
                                </span>
                              )}
                              {i.patch && (
                                <span className="block text-[10px] text-black font-mono truncate">
                                  Patch: {i.patch}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>

                      {/* Total */}
                      <TableCell className="p-4 font-mono font-black text-black text-sm">
                        {formatMYR(order.totalAmount)}
                      </TableCell>

                      {/* Payment & Receipt */}
                      <TableCell className="p-4">
                        <span className="text-[11px] text-black block font-semibold">
                          {order.paymentMethodLabel || "Instant QR Pay"}
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
                          <span className="text-[10px] text-[#D97706] font-mono block mt-1 font-semibold">
                            Pending Slip
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg inline-block border ${
                            order.orderStatus === "SHIPPED" || order.orderStatus === "COMPLETED"
                              ? "bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]"
                              : order.orderStatus === "PROCESSING"
                              ? "bg-[#ECFEFF] text-[#0E7490] border-[#A5F3FC]"
                              : order.orderStatus === "CANCELLED"
                              ? "bg-neutral-100 text-neutral-500 border-neutral-300"
                              : "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                        {order.trackingNumber && (
                          <span className="text-[10px] font-mono text-black block mt-1 truncate max-w-[140px] font-semibold">
                            {order.trackingNumber}
                          </span>
                        )}
                      </TableCell>

                      {/* Action buttons */}
                      <TableCell className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {order.orderStatus === "PENDING_PAYMENT" && (
                          <Button
                            onClick={() => handleConfirmPaid(order.id)}
                            disabled={isUpdating}
                            className="h-auto rounded-lg bg-[#16A34A] px-3 py-1.5 text-xs font-bold hover:bg-[#15803D]"
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
        <DialogContent className="max-w-lg rounded-3xl border-[#E5E5E5] p-6">
          <DialogHeader className="border-b border-[#E5E5E5] pb-3">
            <DialogTitle className="text-sm font-bold text-black font-display uppercase tracking-wider">
              Customer Payment Slip
            </DialogTitle>
          </DialogHeader>

          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#E5E5E5] bg-[#FAFAF9]">
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
        <DialogContent className="max-w-md rounded-3xl border-[#E5E5E5] p-6">
          <DialogHeader className="border-b border-[#E5E5E5] pb-3">
            <DialogTitle className="text-sm font-bold text-black font-display uppercase tracking-wider">
              Dispatch Order #{trackingModalOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="courier" className="text-xs font-bold text-[#57534E]">
                Malaysian Courier Service
              </Label>
              <Select value={courierName} onValueChange={setCourierName}>
                <SelectTrigger id="courier" className="w-full rounded-xl border-[#CCCCCC] text-xs font-medium focus-visible:border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MALAYSIAN_COURIERS.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="trackingNumber" className="text-xs font-bold text-[#57534E]">
                Tracking Code / Consignment Note No.
              </Label>
              <Input
                id="trackingNumber"
                type="text"
                placeholder="e.g. ER123456789MY or JNT987654321"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="rounded-xl border-[#CCCCCC] font-mono text-xs font-bold focus-visible:border-black"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#E5E5E5] pt-2">
            <Button variant="outline" className="h-auto rounded-lg bg-[#F5F5F5] px-4 py-2 text-xs font-bold text-black hover:bg-[#F5F5F4] hover:text-black" onClick={() => setTrackingModalOrder(null)}>
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
