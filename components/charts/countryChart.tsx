import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const COUNTRY_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function CountryChart({ countryData }: { countryData: { country: string; count: number }[] }) {
    if (!countryData || countryData.length === 0) {
        return <div className="h-full flex items-center justify-center text-zinc-500 text-sm italic">No country data available</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={countryData} layout="vertical" margin={{ left: 60 }}>
                <XAxis type="number" stroke="#52525b" fontSize={12} />
                <YAxis type="category" dataKey="country" stroke="#52525b" fontSize={12} width={55} />
                <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {countryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}