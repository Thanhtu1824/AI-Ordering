import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Định nghĩa khung dữ liệu từ Quote Agent
export interface QuoteItem {
    name: string;
    quantity: number;
    unit_price: number;
}

export interface QuoteProps {
    quote_id: string;
    items: QuoteItem[];
    items_total: number;
    shipping_fee: number;
    tax: number;
    grand_total: number;
    currency?: string;
    valid_until: string;
}

export function QuoteSummary({
    quote_id,
    items,
    items_total,
    shipping_fee,
    tax,
    grand_total,
    currency = "VND",
    valid_until,
}: QuoteProps) {
    const formatCurrency = (amount: number) => {
        return amount.toLocaleString("vi-VN") + " " + currency;
    };

    return (
        <Card className="w-full max-w-md border-2 border-blue-100 shadow-md">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold">Báo giá chi tiết</CardTitle>
                    <Badge variant="outline" className="text-slate-500">
                        #{quote_id}
                    </Badge>
                </div>
                <p className="text-sm text-slate-500">Có hiệu lực đến: {valid_until}</p>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Danh sách sản phẩm */}
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                            <span>
                                {item.quantity}x {item.name}
                            </span>
                            <span className="font-medium">{formatCurrency(item.quantity * item.unit_price)}</span>
                        </div>
                    ))}
                </div>

                <Separator />

                {/* Chi tiết các khoản phí */}
                <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                        <span>Tạm tính</span>
                        <span>{formatCurrency(items_total)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Phí vận chuyển</span>
                        <span>{formatCurrency(shipping_fee)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Thuế (VAT)</span>
                        <span>{formatCurrency(tax)}</span>
                    </div>
                </div>

                <Separator className="bg-blue-200" />

                {/* Tổng tiền */}
                <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-semibold">Tổng thanh toán</span>
                    <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(grand_total)}
                    </span>
                </div>
            </CardContent>

            <CardFooter className="flex gap-3 pt-2">
                <Button variant="outline" className="w-full">
                    Từ chối
                </Button>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Xác nhận đặt hàng
                </Button>
            </CardFooter>
        </Card>
    );
}