"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface ChatContextType {
  messages: any[];
  sendMessage: (msg: string) => void;
  uiEvent: any | null;
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  sendMessage: () => {},
  uiEvent: null,
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState([{ role: "ai", content: "Xin chào! Hôm nay tôi có thể giúp bạn đặt hàng món gì?" }]);
  const [uiEvent, setUiEvent] = useState<any | null>(null);
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

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = (text: string) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    if (socket) {
      socket.emit("sendMessage", text);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, uiEvent }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
