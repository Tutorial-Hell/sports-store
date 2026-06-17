'use client'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

type SalesChartProps = {
    data: {
        month: string
        totalSales: number
    }[]
}

const SalesChart = ({ data }: SalesChartProps) => {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Bar dataKey="totalSales" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}

export default SalesChart
