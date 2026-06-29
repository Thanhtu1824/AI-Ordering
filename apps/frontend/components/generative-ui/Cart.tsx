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
  importDuty?: number;
  tax?: number;
  shippingFee?: number;
  total: number;
  isQuote?: boolean;
  totalAppliedWeight?: number;
}

export function Cart({ items, subtotal, importDuty, tax, shippingFee, total, isQuote, totalAppliedWeight }: CartProps) {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + " VNĐ";
  };

  const totalTaxesAndFees = (importDuty || 0) + (tax || 0) + (shippingFee || 0);

  return (
    <Card className="w-full shadow-sm border-zinc-200 dark:border-zinc-800">
      <CardHeader className="bg-zinc-50 dark:bg-zinc-800/50 rounded-t-xl pb-4">
        <div className="flex items-center space-x-2">
          <div className="bg-zinc-900 dark:bg-zinc-100 p-2 rounded-full">
            <ShoppingCart className="w-5 h-5 text-zinc-50 dark:text-zinc-900" />
          </div>
          <div>
            <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
              {isQuote ? "Yêu cầu báo giá" : "Bảng tính phí nhập khẩu"}
            </CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {isQuote
                ? "Có sản phẩm nước ngoài cần liên hệ báo giá"
                : "Bảng kê chi tiết các khoản thuế phí nhập khẩu"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
          {items.map((item, index) => (
            <div key={item.id || index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
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

        {!isQuote && (
          <div className="mt-8 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Khoản mục</th>
                  <th className="px-4 py-3 font-semibold text-right">Giá trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Giá gốc sản phẩm</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(subtotal || 0)}</td>
                </tr>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/20">
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    Phí vận chuyển {totalAppliedWeight ? `(${totalAppliedWeight.toFixed(1)}kg)` : ''}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(shippingFee || 0)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Thuế nhập khẩu</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(importDuty || 0)}</td>
                </tr>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/20">
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Thuế VAT</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(tax || 0)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Cộng thuế & phí</td>
                  <td className="px-4 py-3 text-right font-medium text-amber-600">{formatCurrency(totalTaxesAndFees)}</td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-900/20">
                  <td className="px-4 py-4 font-bold text-blue-700 dark:text-blue-300">TỔNG TIỀN THANH TOÁN</td>
                  <td className="px-4 py-4 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {!isQuote && <Separator />}

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
