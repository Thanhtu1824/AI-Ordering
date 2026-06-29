import { PackageSearch, MapPin, Package, CreditCard, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
  product: {
    name: string;
    imageUrl: string | null;
  };
  quantity: number;
  price: number;
}

interface OrderTrackingProps {
  id: string;
  status: string;
  totalAmount: number;
  shippingFee: number;
  importDuty: number;
  tax: number;
  shippingAddress: string | null;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

export function OrderTracking(props: OrderTrackingProps) {
  const formatCurrency = (amount: number) => amount.toLocaleString("vi-VN") + " VNĐ";
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString("vi-VN");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-800">Chờ xử lý</Badge>;
      case "AWAITING_QUOTE":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Chờ báo giá</Badge>;
      case "PROCESSING":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Đang xử lý</Badge>;
      case "SHIPPED":
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">Đang giao hàng</Badge>;
      case "DELIVERED":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700">Đã giao hàng</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethod = (method: string) => {
    switch (method) {
      case "CASH_ON_DELIVERY": return "Thanh toán khi nhận hàng (COD)";
      case "CREDIT_CARD": return "Thẻ tín dụng";
      case "BANK_TRANSFER": return "Chuyển khoản ngân hàng";
      default: return method;
    }
  };

  const subtotal = props.totalAmount - props.shippingFee - props.importDuty - props.tax;

  return (
    <Card className="w-full max-w-2xl border-emerald-200/50 shadow-emerald-900/5 bg-gradient-to-b from-emerald-50/30 to-white overflow-hidden rounded-3xl">
      <CardHeader className="text-center pb-6 pt-10 px-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm border border-emerald-200/50">
          <PackageSearch className="w-8 h-8" />
        </div>
        <CardTitle className="text-2xl font-bold text-emerald-950 mb-2">Thông tin đơn hàng</CardTitle>
        <CardDescription className="text-emerald-700/80 font-medium">Mã: #{props.id.split('-')[0].toUpperCase()}</CardDescription>
        <div className="mt-4 flex justify-center">
          {getStatusBadge(props.status)}
        </div>
      </CardHeader>

      <CardContent className="px-8 pb-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột trái */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-zinc-400" /> Ngày đặt hàng
              </h3>
              <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                {formatDate(props.createdAt)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-zinc-400" /> Địa chỉ giao hàng
              </h3>
              <div className="text-sm text-zinc-600 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 leading-relaxed shadow-sm">
                {props.shippingAddress || "Chưa cập nhật địa chỉ"}
              </div>
            </div>
          </div>

          {/* Cột phải */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-zinc-400" /> Thanh toán
              </h3>
              <div className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-100 space-y-2">
                <p><strong>Phương thức:</strong> {getPaymentMethod(props.paymentMethod)}</p>
                <p><strong>Trạng thái:</strong> {props.paymentStatus === 'PENDING' ? 'Chưa thanh toán' : 'Đã thanh toán'}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-zinc-400" /> Sản phẩm đã đặt
          </h3>
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-100">
              {props.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500 font-medium">{item.quantity}x</span>
                    <span className="text-sm font-medium text-zinc-800">{item.product.name}</span>
                  </div>
                  <span className="text-sm font-bold text-zinc-900">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-zinc-50/80 p-5 space-y-3 border-t border-zinc-200">
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Tạm tính</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Phí vận chuyển</span>
                <span className="font-medium">{formatCurrency(props.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Thuế nhập khẩu</span>
                <span className="font-medium">{formatCurrency(props.importDuty)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Thuế VAT</span>
                <span className="font-medium">{formatCurrency(props.tax)}</span>
              </div>
              
              <div className="pt-3 border-t border-zinc-200/60 flex justify-between items-end">
                <span className="text-base font-bold text-zinc-900">Tổng thanh toán</span>
                <span className="text-xl font-black text-emerald-600">{formatCurrency(props.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
