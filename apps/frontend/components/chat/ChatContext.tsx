"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface ChatContextType {
  messages: any[];
  sendMessage: (msg: string) => void;
  uiEvent: any | null;
  isTyping: boolean;
  isRateLimited: boolean;
  cooldownRemaining: number;
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  sendMessage: () => {},
  uiEvent: null,
  isTyping: false,
  isRateLimited: false,
  cooldownRemaining: 0,
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState([{ role: "ai", content: "Xin chào! Hôm nay tôi có thể giúp bạn đặt hàng món gì?" }]);
  const [uiEvent, setUiEvent] = useState<any | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("aiResponse", (data) => {
      setMessages((prev) => [...prev, { role: "ai", content: data.text }]);
      if (data.uiEvent) {
        setUiEvent(data.uiEvent);
      }
    });

    newSocket.on("typing", (typingStatus: boolean) => {
      setIsTyping(typingStatus);
    });

    newSocket.on("rateLimit", (data: { cooldownMs: number }) => {
      setIsRateLimited(true);
      setCooldownRemaining(Math.ceil(data.cooldownMs / 1000));
      
      const intervalId = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = (text: string) => {
    if (isRateLimited || isTyping) return;
    setIsTyping(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    if (socket) {
      socket.emit("sendMessage", text);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, uiEvent, isTyping, isRateLimited, cooldownRemaining }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
