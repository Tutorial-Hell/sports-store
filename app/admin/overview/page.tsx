import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-guard";
import { getOrderSummary } from "@/lib/actions/order.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign, Barcode, CreditCardIcon, Users } from "lucide-react";
import { FormatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import SalesChart from "./sales-chart";

export const metadata:Metadata ={
    title: 'Admin Overview'
}

const AdminOverviewPage = async () => {
    await requireAdmin()

    const summary = await getOrderSummary()

    return ( <div className="space-y-2">
        <h1 className="h2-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <BadgeDollarSign />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {FormatCurrency(summary.totalSales._sum.totalPrice?.toString() || 0)}
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <CreditCardIcon />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {formatNumber(summary.ordersCount)}
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {formatNumber(summary.usersCount)}
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Barcode />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {formatNumber(summary.productsCount)}
                </div>
            </CardContent>
        </Card>
        </div>
        <div className="grid-gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <SalesChart data={summary.salesData} />
                </CardContent>
            </Card>

             <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Buyer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary.latestSales.map((order) => <TableRow key={order.id}>
                                <TableCell>
                                    {order?.user?.name ? order.user.name : "Deleted user"}
                                </TableCell>
                                <TableCell>
                                    {formatDateTime(order.createdAt).dateOnly}
                                </TableCell>
                                <TableCell>
                                    {FormatCurrency(order.totalPrice)}
                                </TableCell>
                                <TableCell>
                                    <Link href={`/order/${order.id}`}>
                                      <span className="px-2">Details</span>
                                    </Link>
                                </TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    </div> );
}
 
export default AdminOverviewPage;