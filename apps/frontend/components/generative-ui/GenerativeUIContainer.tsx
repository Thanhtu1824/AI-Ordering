"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChat } from "../chat/ChatContext";
import { QuoteSummary } from "./QuoteSummary";
import { ProductCard } from "./ProductCard";
import { OrderConfirmation } from "./OrderConfirmation";
import { Cart } from "./Cart";

export function GenerativeUIContainer() {
  const { uiEvent } = useChat();

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 flex items-center h-16">
        <h2 className="text-xl font-semibold tracking-tight">Kết quả</h2>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-3xl">
          {uiEvent && uiEvent.type === 'ORDER_CONFIRMATION' ? (
            <div className="flex justify-center">
              <OrderConfirmation {...uiEvent.data} />
            </div>
          ) : uiEvent && uiEvent.type === 'CART' ? (
            <Cart {...uiEvent.data} />
          ) : uiEvent && uiEvent.type === 'QUOTE' ? (
            <div className="flex justify-center">
              <QuoteSummary {...uiEvent.data} />
            </div>
          ) : uiEvent && uiEvent.type === 'PRODUCT_CARD' ? (
            Array.isArray(uiEvent.data) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                {uiEvent.data.map((product: any) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <div className="w-full max-w-sm mx-auto">
                <ProductCard {...uiEvent.data} />
              </div>
            )
          ) : (
            <Card className="w-full shadow-sm border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Chưa có dữ liệu</CardTitle>
                <CardDescription>Hãy yêu cầu AI tra cứu sản phẩm hoặc báo giá để xem kết quả tại đây.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 font-medium">
                  Khu vực hiển thị UI động
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
