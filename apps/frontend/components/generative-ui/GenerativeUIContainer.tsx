"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChat } from "../chat/ChatContext";
import { QuoteSummary } from "./QuoteSummary";

export function GenerativeUIContainer() {
  const { uiEvent } = useChat();

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      <div className="p-8 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Kết quả động (Generative UI)</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">Các thành phần UI như báo giá, thẻ sản phẩm sẽ hiển thị ở đây.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl w-full mx-auto flex justify-center">
          {uiEvent && uiEvent.type === 'QUOTE' ? (
            <QuoteSummary {...uiEvent.data} />
          ) : (
            <Card className="w-full shadow-sm border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Chưa có dữ liệu</CardTitle>
                <CardDescription>Hãy yêu cầu AI báo giá để xem Generative UI hoạt động.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">
                  Khu vực hiển thị UI
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
