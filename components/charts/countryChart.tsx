"use client";

import { Suspense } from "react";
import { ChartSkeleton } from "../sekeletons/cardSekeleton";
import { LazyContainer } from "@/lib/utils";


const COUNTRY_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function CountryChart({ countryData }: { countryData: { country: string; count: number }[] }) {
    return (
        <Suspense fallback={<ChartSkeleton />}>
            <LazyContainer.ResponsiveContainer width="100%" height="100%">
                <LazyContainer.BarChart data={countryData} layout="vertical" margin={{ left: 60 }}>
                    <LazyContainer.XAxis type="number" stroke="#52525b" fontSize={12} />
                    <LazyContainer.YAxis type="category" dataKey="country" stroke="#52525b" fontSize={12} width={55} />
                    <LazyContainer.Tooltip
                        contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                        itemStyle={{ color: "#fff" }}
                    />
                    <LazyContainer.Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {countryData.map((_, index) => (
                            <LazyContainer.Cell key={`cell-${index}`} fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} />
                        ))}
                    </LazyContainer.Bar>
                </LazyContainer.BarChart>
            </LazyContainer.ResponsiveContainer>
        </Suspense>
    );
}