"use client";

import { LazyContainer } from "@/lib/utils";
import { ChartSkeleton } from "../sekeletons/cardSekeleton";
import { Suspense } from "react";



export function DeviceChart({ deviceData }: { deviceData: { name: string; value: number; color: string }[] }) {
    return (
        <Suspense fallback={<ChartSkeleton />}>
            <LazyContainer.ResponsiveContainer width="100%" height="100%">
                <LazyContainer.PieChart>
                    <LazyContainer.Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                    >
                        {deviceData.map((entry, index) => (
                            <LazyContainer.Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </LazyContainer.Pie>
                    <LazyContainer.Tooltip
                        contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                        itemStyle={{ color: "#fff" }}
                    />
                </LazyContainer.PieChart>
            </LazyContainer.ResponsiveContainer>
        </Suspense>
    );
}