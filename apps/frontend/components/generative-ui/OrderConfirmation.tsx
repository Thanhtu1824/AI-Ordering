import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MapPin, Package } from "lucide-react";

export interface OrderConfirmationProps {
    id: string;
    totalAmount: number;
    shippingFee?: number;
    importDuty?: number;
    tax?: number;
    isQuote?: boolean;
    items: {
        productName: string;
        quantity: number;
        price: number;
    }[];
    shippingAddress: string;
}

export function OrderConfirmation({
    id,
    totalAmount,
    shippingFee,
    importDuty,
    tax,
    isQuote,
    items,
    shippingAddress,
}: OrderConfirmationProps) {
    const formatCurrency = (amount: number) => {
        return amount.toLocaleString("vi-VN") + " VNĐ";
    };

    const subtotal = totalAmount - (tax || 0) - (importDuty || 0) - (shippingFee || 0);

    return (
        <Card className="w-full max-w-md border-2 border-emerald-100 shadow-md">
            <CardHeader className="pb-4 bg-emerald-50/50 rounded-t-xl">
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <CardTitle className="text-xl font-bold text-emerald-700">
                        {isQuote ? "Gửi yêu cầu báo giá thành công!" : "Đặt hàng thành công!"}
                    </CardTitle>
                    <p className="text-sm text-slate-500">Mã: #{id.substring(0, 8).toUpperCase()}</p>
                    {isQuote && (
                        <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md mt-1">
                            Nhân viên sẽ liên hệ lại với bạn để báo giá chính xác.
                        </p>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
                {/* Thông tin giao hàng */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center text-slate-700">
                        <MapPin className="w-4 h-4 mr-2 text-emerald-600" /> Địa chỉ giao hàng
                    </h3>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600">
                        {shippingAddress}
                    </div>
                </div>

                {/* Chi tiết đơn hàng */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center text-slate-700">
                        <Package className="w-4 h-4 mr-2 text-emerald-600" /> Chi tiết đơn hàng
                    </h3>
                    <div className="space-y-3">
                        {items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className="text-slate-600 max-w-[200px] truncate" title={item.productName}>
                                    {item.quantity}x <span className="font-medium text-slate-900">{item.productName}</span>
                                </span>
                                <span className="font-medium whitespace-nowrap ml-2">
                                    {item.price > 0 ? formatCurrency(item.quantity * item.price) : "Chờ báo giá"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator className="bg-emerald-100" />

                {/* Tổng tiền */}
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                    <div className="flex justify-between items-center">
                        <span>Giá gốc sản phẩm</span>
                        <span className="font-medium">
                            {subtotal > 0 ? formatCurrency(subtotal) : "Chờ báo giá"}
                        </span>
                    </div>
                    {!isQuote && (
                        <>
                            <div className="flex justify-between items-center">
                                <span>Phí vận chuyển</span>
                                <span className="font-medium">{formatCurrency(shippingFee || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Thuế nhập khẩu</span>
                                <span className="font-medium">{formatCurrency(importDuty || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Thuế VAT</span>
                                <span className="font-medium">{formatCurrency(tax || 0)}</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-slate-700">Tổng thanh toán</span>
                    <span className="text-xl font-bold text-emerald-600">
                        {isQuote ? "Chờ báo giá" : formatCurrency(totalAmount)}
                    </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-slate-500">Thanh toán</span>
                    <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">Thanh toán khi nhận hàng</Badge>
                </div>
            </CardContent>

            <CardFooter className="flex gap-3 pt-2">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Tiếp tục mua sắm
                </Button>
            </CardFooter>
        </Card>
    );
}
