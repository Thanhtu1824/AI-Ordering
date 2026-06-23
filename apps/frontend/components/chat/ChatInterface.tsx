"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "./ChatContext";

export function ChatInterface() {
  const { messages, sendMessage, isTyping, isRateLimited, cooldownRemaining } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || isRateLimited) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <h2 className="text-lg font-semibold tracking-tight text-center">Trợ lý Đặt hàng AI</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] shadow-sm ${msg.role === 'user' ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl max-w-[80%] bg-zinc-100 dark:bg-zinc-900 shadow-sm">
                <div className="flex space-x-1.5 items-center h-4">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-950">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRateLimited ? "Vui lòng đợi..." : (isTyping ? "AI đang trả lời..." : "Nhập yêu cầu đặt hàng...")}
            disabled={isRateLimited || isTyping}
            className="rounded-xl h-14 text-xl md:text-xl px-5 shadow-sm"
          />
          <Button 
            type="submit" 
            disabled={isRateLimited || isTyping}
            className={`rounded-xl h-14 px-8 text-xl md:text-xl font-medium shadow-sm transition-all ${(isRateLimited || isTyping) ? 'opacity-50 cursor-not-allowed bg-zinc-400' : 'hover:shadow-md'}`}
          >
            {isRateLimited ? `${cooldownRemaining}s` : 'Gửi'}
          </Button>
        </form>
      </div>
    </div>
  );
}
