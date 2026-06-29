"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  requiresQuote?: boolean;
  quantity: number;
}

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
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
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
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const newSocket = io(apiUrl);
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
          // Đồng bộ giỏ hàng local khi AI hiển thị giỏ hàng
          if (data.uiEvent.type === 'CART' && data.uiEvent.data && data.uiEvent.data.items) {
            setCartItems(data.uiEvent.data.items.map((i: any) => ({
              id: i.id,
              name: i.name,
              price: i.price,
              imageUrl: i.imageUrl || null,
              requiresQuote: i.requiresQuote,
              quantity: i.quantity
            })));
          } else if (data.uiEvent.type === 'ORDER_CONFIRMATION') {
            // Xóa giỏ hàng sau khi đặt hàng thành công
            setCartItems([]);
          }
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

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => setCartItems([]);

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
    <ChatContext.Provider value={{ messages, sendMessage, uiEvent, isTyping, isRateLimited, cooldownRemaining, user, logout, suggestions, cartItems, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);

