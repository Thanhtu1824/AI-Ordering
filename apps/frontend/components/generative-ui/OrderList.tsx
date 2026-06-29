"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag, History, ChevronRight, Package, MapPin, Clock } from "lucide-react";
import { OrderTracking } from "./OrderTracking";

interface OrderItem {
  product: { name: string };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  shippingFee: number;
  importDuty: number;
  tax: number;
  shippingAddress: string | null;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

interface OrderListProps {
  orders: Order[];
  listType: "active" | "history";
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-zinc-100 text-zinc-800 border-zinc-300" },
  AWAITING_QUOTE: { label: "Chờ báo giá", color: "bg-amber-100 text-amber-800 border-amber-300" },
  PROCESSING: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800 border-blue-300" },
  SHIPPED: { label: "Đang giao", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  DELIVERED: { label: "Đã giao", color: "bg-emerald-600 text-white border-emerald-600" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-800 border-red-300" },
};

function formatCurrency(n: number) {
  return n.toLocaleString("vi-VN") + " VNĐ";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
}

function shortId(id: string) {
  return "#" + id.split("-")[0].toUpperCase();
}

export function OrderList({ orders, listType }: OrderListProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const isActive = listType === "active";
  const Icon = isActive ? ShoppingBag : History;
  const title = isActive ? "Đơn hàng đang đặt" : "Lịch sử đơn hàng";
  const description = isActive
    ? `${orders.length} đơn hàng đang được xử lý`
    : `${orders.length} đơn hàng đã hoàn tất`;

  if (selectedOrder) {
    return (
      <div className="w-full max-w-2xl">
        <button
          onClick={() => setSelectedOrder(null)}
          className="mb-4 text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
        >
          ← Quay lại danh sách
        </button>
        <OrderTracking {...(selectedOrder as any)} />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="w-full max-w-2xl rounded-3xl border-zinc-200 shadow-sm">
        <CardHeader className="text-center py-12">
          <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-7 h-7 text-zinc-400" />
          </div>
          <CardTitle className="text-lg text-zinc-600">
            {isActive ? "Không có đơn hàng nào đang xử lý" : "Chưa có lịch sử đơn hàng"}
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl rounded-3xl overflow-hidden border-zinc-200 shadow-sm">
      <CardHeader className="relative px-6 pt-8 pb-5 overflow-hidden">
        <div className={`absolute top-0 inset-x-0 h-1.5 ${isActive ? "bg-gradient-to-r from-blue-400 to-emerald-500" : "bg-gradient-to-r from-zinc-400 to-zinc-600"}`} />
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isActive ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-600"}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-zinc-900">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-6">
        <div className="space-y-2">
          {orders.map((order) => {
            const statusInfo = STATUS_LABELS[order.status] ?? { label: order.status, color: "bg-zinc-100 text-zinc-700" };
            const firstItem = order.items?.[0];
            const moreItems = order.items?.length > 1 ? order.items.length - 1 : 0;

            return (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="w-full text-left bg-white border border-zinc-100 rounded-2xl p-4 hover:bg-zinc-50 hover:border-zinc-200 hover:shadow-sm transition-all flex items-center gap-4 group"
              >
                {/* Icon */}
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-zinc-200 transition-colors">
                  <Package className="w-5 h-5 text-zinc-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-zinc-900 text-sm">{shortId(order.id)}</span>
                    <Badge className={`text-[10px] px-2 py-0 h-4 font-medium border ${statusInfo.color} rounded-full`} variant="outline">
                      {statusInfo.label}
                    </Badge>
                  </div>

                  <p className="text-xs text-zinc-500 truncate">
                    {firstItem
                      ? `${firstItem.quantity}x ${firstItem.product?.name}${moreItems > 0 ? ` +${moreItems} sản phẩm khác` : ""}`
                      : "Không có sản phẩm"}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(order.createdAt)}
                    </span>
                    {order.shippingAddress && (
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 truncate max-w-[140px]">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{order.shippingAddress}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount + arrow */}
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{formatCurrency(order.totalAmount)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
