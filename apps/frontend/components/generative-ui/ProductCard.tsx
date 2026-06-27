"use client";

import React, { useState } from 'react';
import { ShoppingCart, Star, Package, Tag, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChat } from '../chat/ChatContext';

interface ProductData {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  description?: string;
  price: number;
  requiresQuote?: boolean;
  imageUrl?: string;
}

export function ProductCard(product: ProductData) {
  const { addToCart } = useChat();
  const [added, setAdded] = useState(false);

  const formattedPrice = product.price > 0
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)
    : null;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      requiresQuote: product.requiresQuote || product.price === 0,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Card className="w-full h-full shadow-md hover:shadow-lg transition-all duration-300 border-zinc-200 dark:border-zinc-800 overflow-hidden group bg-white dark:bg-zinc-950 flex flex-col">
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden shrink-0">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-in-out"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-zinc-400">
            <Package className="w-16 h-16 opacity-20" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {product.brand && (
            <Badge className="bg-black/70 hover:bg-black/80 text-white backdrop-blur-sm border-none text-[10px] px-2 py-0.5">
              {product.brand}
            </Badge>
          )}
          {product.requiresQuote || product.price === 0 ? (
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 text-[10px] px-2 py-0.5">
              Liên hệ báo giá
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 text-[10px] px-2 py-0.5">
              Order ngay
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="p-3 pb-1 shrink-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight line-clamp-2">
            {product.name}
          </CardTitle>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3 h-3 fill-current" />
              <Star className="w-3 h-3 fill-current" />
              <Star className="w-3 h-3 fill-current" />
              <Star className="w-3 h-3 fill-current" />
              <Star className="w-3 h-3 fill-current opacity-50" />
              <span className="text-[10px] text-zinc-500 ml-1">(4.0)</span>
            </div>
            <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
              {formattedPrice ?? <span className="text-amber-600 text-sm">Liên hệ</span>}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-1 flex-1">
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-xs line-clamp-2">
          {product.description || "Chưa có thông tin mô tả cho sản phẩm này."}
        </p>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>Mã: {product.slug?.substring(0,8) || product.id.substring(0,8)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 p-3 shrink-0 mt-auto">
        <Button
          className={`w-full rounded-lg h-9 text-xs font-semibold shadow-sm transition-all ${
            added
              ? "bg-zinc-500 cursor-default"
              : product.requiresQuote || product.price === 0
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
          onClick={handleAddToCart}
          disabled={added}
        >
          {added ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Đã thêm!
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              {product.requiresQuote || product.price === 0 ? "Yêu cầu báo giá" : "Thêm vào giỏ hàng"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}


