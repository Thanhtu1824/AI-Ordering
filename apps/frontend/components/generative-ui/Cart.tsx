import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  subtotal: number;
}

export interface CartProps {
  items: CartItem[];
  subtotal?: number;
  tax?: number;
  shippingFee?: number;
  total: number;
  isQuote?: boolean;
}

export function Cart({ items, subtotal, tax, shippingFee, total, isQuote }: CartProps) {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + " đ";
  };

  return (
    <Card className="w-full shadow-sm border-zinc-200 dark:border-zinc-800">
      <CardHeader className="bg-zinc-50 dark:bg-zinc-800/50 rounded-t-xl pb-4">
        <div className="flex items-center space-x-2">
          <div className="bg-zinc-900 dark:bg-zinc-100 p-2 rounded-full">
            <ShoppingCart className="w-5 h-5 text-zinc-50 dark:text-zinc-900" />
          </div>
          <div>
            <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
              {isQuote ? "Yêu cầu báo giá" : "Giỏ hàng tạm tính"}
            </CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {isQuote 
                ? "Có sản phẩm nước ngoài cần liên hệ báo giá" 
                : "Khách hàng vui lòng kiểm tra lại số lượng trước khi chốt đơn"}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id || index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300">No Img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {item.price > 0 ? formatCurrency(item.price) : "Chờ báo giá"}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">×</span>
                  <Badge variant="secondary" className="px-1.5 py-0 rounded-sm bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">SL: {item.quantity}</Badge>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.subtotal > 0 ? formatCurrency(item.subtotal) : "Chờ báo giá"}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {(subtotal !== undefined || tax !== undefined || shippingFee !== undefined) && (
          <div className="mt-6 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Separator className="mb-4" />
            <div className="flex justify-between">
              <span>Tạm tính hàng hóa:</span>
              <span className="font-medium">{formatCurrency(subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Thuế nhập khẩu (10%):</span>
              <span className="font-medium">{formatCurrency(tax || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển quốc tế:</span>
              <span className="font-medium">{formatCurrency(shippingFee || 0)}</span>
            </div>
          </div>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex-col pt-6 pb-6">
        <div className="flex justify-between w-full items-end mb-4">
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Tổng cộng</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {isQuote ? "Liên hệ báo giá" : formatCurrency(total)}
          </span>
        </div>
        <p className="text-sm text-center text-zinc-500 w-full">
          Gõ <strong>"Xác nhận"</strong> vào khung chat để {isQuote ? "gửi yêu cầu" : "tạo đơn hàng"}.
        </p>
      </CardFooter>
    </Card>
  );
}
