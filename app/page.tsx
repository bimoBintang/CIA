import { AboutSection } from "@/components/common/about-section";
import { CommunitySection } from "@/components/common/communitySection";
import { ContactSection } from "@/components/common/contactSection";
import { EventsSection } from "@/components/common/event-section";
import { Footer } from "@/components/common/footerSection";
import { HeroSection } from "@/components/common/hero-section";
import { MatrixRain } from "@/components/common/matrixRainSection";
import { Navigation } from "@/components/common/navigatorSection";
import { NewsSection } from "@/components/common/news-section";


export default function Home() {
  return (
    <>
      <MatrixRain />
      <Navigation />
      <main className="relative z-10">
        <HeroSection />
        <AboutSection />
        <EventsSection />
        <NewsSection />
        <CommunitySection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
