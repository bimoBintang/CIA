
import { PortalHeader } from "@/components/portal/header";
import { ProfileCardSection } from "@/components/portal/profileCardSection";



export default function AgentPortalPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <PortalHeader />

            {/* Profile Card */}
            <ProfileCardSection />
        </div>
    );
}
