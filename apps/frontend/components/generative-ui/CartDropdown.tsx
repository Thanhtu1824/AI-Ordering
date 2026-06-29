"use client";

import { useState, useRef, useEffect } from "react";
import { ShoppingCart, X, Plus, Minus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChat } from "../chat/ChatContext";

export function CartDropdown() {
  const { cartItems, removeFromCart, updateQuantity, sendMessage, clearCart } = useChat();
  const [open, setOpen] = useState(false);
  const [showQuoteConfirm, setShowQuoteConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const hasQuoteItems = cartItems.some((i) => i.requiresQuote || i.price === 0);
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const formatCurrency = (n: number) => n.toLocaleString("vi-VN") + " VNĐ";

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowQuoteConfirm(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOrder = () => {
    if (hasQuoteItems) {
      setShowQuoteConfirm(true);
    } else {
      const itemsDesc = cartItems
        .map((i) => `${i.quantity} ${i.name}`)
        .join(", ");
      sendMessage(`Tôi muốn đặt hàng: ${itemsDesc}`);
      setOpen(false);
      clearCart();
    }
  };

  const handleConfirmQuote = () => {
    const itemsDesc = cartItems.map((i) => `${i.quantity} ${i.name}`).join(", ");
    sendMessage(`Tôi muốn yêu cầu báo giá cho: ${itemsDesc}`);
    setOpen(false);
    setShowQuoteConfirm(false);
    clearCart();
  };

  if (totalItems === 0 && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Giỏ hàng"
      >
        <ShoppingCart className="w-5 h-5 text-zinc-500" />
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Cart Icon Button */}
      <button
        onClick={() => { setOpen(!open); setShowQuoteConfirm(false); }}
        className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Giỏ hàng"
      >
        <ShoppingCart className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
            {totalItems}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Giỏ hàng ({totalItems} sản phẩm)
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quote Confirmation Overlay */}
          {showQuoteConfirm && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Giỏ hàng có sản phẩm <strong>cần liên hệ báo giá</strong>. Nhấn xác nhận để chuyển sang tư vấn với nhân viên.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowQuoteConfirm(false)}
                  className="flex-1 text-xs h-8"
                >
                  Huỷ
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmQuote}
                  className="flex-1 text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Xác nhận gửi báo giá
                </Button>
              </div>
            </div>
          )}

          {/* Items List */}
          {cartItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-zinc-400 text-sm">
              Giỏ hàng trống
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  {/* Image */}
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs">No img</div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.requiresQuote || item.price === 0 ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">Liên hệ báo giá</Badge>
                      ) : (
                        formatCurrency(item.price)
                      )}
                    </p>
                  </div>
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-xs font-semibold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {cartItems.length > 0 && !showQuoteConfirm && (
            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
              {!hasQuoteItems && (
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-zinc-500">Tạm tính:</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(subtotal)}</span>
                </div>
              )}
              {hasQuoteItems && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Có sản phẩm cần liên hệ báo giá
                </p>
              )}
              <Button
                onClick={handleOrder}
                className={`w-full text-sm h-9 font-semibold rounded-xl ${hasQuoteItems ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"} text-white`}
              >
                {hasQuoteItems ? "Gửi yêu cầu báo giá" : "Đặt hàng ngay"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
