"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChat } from "../chat/ChatContext";
import { QuoteSummary } from "./QuoteSummary";
import { ProductCard } from "./ProductCard";
import { OrderConfirmation } from "./OrderConfirmation";

export function GenerativeUIContainer() {
  const { uiEvent } = useChat();

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 flex items-center h-16">
        <h2 className="text-xl font-semibold tracking-tight">Kết quả</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl w-full mx-auto flex justify-center">
          {uiEvent && uiEvent.type === 'ORDER_CONFIRMATION' ? (
            <OrderConfirmation {...uiEvent.data} />
          ) : uiEvent && uiEvent.type === 'QUOTE' ? (
            <QuoteSummary {...uiEvent.data} />
          ) : uiEvent && uiEvent.type === 'PRODUCT_CARD' ? (
            Array.isArray(uiEvent.data) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 w-full">
                {uiEvent.data.map((product: any) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <ProductCard {...uiEvent.data} />
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
