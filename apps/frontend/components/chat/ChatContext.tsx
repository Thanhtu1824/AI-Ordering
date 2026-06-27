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
  user: any | null;
  logout: () => void;
  suggestions: string[];
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  sendMessage: () => {},
  uiEvent: null,
  isTyping: false,
  isRateLimited: false,
  cooldownRemaining: 0,
  user: null,
  logout: () => {},
  suggestions: [],
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState([{ role: "ai", content: "Xin chào! Hôm nay tôi có thể giúp bạn đặt hàng món gì?" }]);
  const [uiEvent, setUiEvent] = useState<any | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Load from localStorage on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }

    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("aiResponse", (data) => {
      setMessages((prev) => [...prev, { role: "ai", content: data.text }]);
      setSuggestions(data.suggestions || []);
      if (data.uiEvent) {
        if (data.uiEvent.type === 'AUTH_SUCCESS') {
          const { token: newToken, user: newUser } = data.uiEvent.data;
          setToken(newToken);
          setUser(newUser);
          localStorage.setItem('token', newToken);
          localStorage.setItem('user', JSON.stringify(newUser));
          // Không gọi setUiEvent để giữ nguyên UI (ProductCard) trước đó
        } else {
          setUiEvent(data.uiEvent);
        }
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
    setSuggestions([]); // Clear suggestions while waiting
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    if (socket) {
      socket.emit("sendMessage", { text, token });
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMessages([{ role: "ai", content: "Bạn đã đăng xuất. Tôi có thể giúp gì cho bạn tiếp theo?" }]);
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, uiEvent, isTyping, isRateLimited, cooldownRemaining, user, logout, suggestions }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
