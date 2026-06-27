import React from 'react';
import { ShoppingCart, Star, Package, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductData {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export function ProductCard(product: ProductData) {
  // Format price to VND
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(product.price);

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
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 text-[10px] px-2 py-0.5">
            Order ngay
          </Badge>
        </div>
      </div>

      <CardHeader className="p-3 pb-1 shrink-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight line-clamp-2">
            {product.name}
          </CardTitle>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current opacity-50" />
              <span className="text-[10px] text-zinc-500 ml-1">(4.0)</span>
            </div>
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
              {formattedPrice}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-1 flex-1">
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-xs line-clamp-2">
          {product.description || "Chưa có thông tin mô tả cho sản phẩm này."}
        </p>
        
        <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>Mã: {product.slug?.substring(0,8) || product.id.substring(0,8)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 p-3 shrink-0 mt-auto">
        <Button 
          className="w-full rounded-lg h-10 text-sm font-semibold shadow-sm hover:shadow transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => {
            // Future integration with the chat input
            alert(`Đã thêm ${product.name} vào giỏ hàng giả lập!`);
          }}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Thêm vào giỏ hàng
        </Button>
      </CardFooter>
    </Card>
  );
}
