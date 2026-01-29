import { DashboardSection } from "@/components/dashboard/dashboardSection";
import { LoadingSkeleton } from "@/components/sekeletons/LoadingSekeleton";
import { Suspense } from "react";

export default function Dashboard() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <DashboardSection />
        </Suspense>
    );
}
