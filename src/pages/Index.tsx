import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import WhyTrustUs from "@/components/WhyTrustUs";
import LiveStats from "@/components/LiveStats";
import Footer from "@/components/Footer";
import EmergencyButton from "@/components/EmergencyButton";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <div id="how">
        <HowItWorks />
      </div>
      <div id="trust">
        <WhyTrustUs />
      </div>
      <div id="stats">
        <LiveStats />
      </div>
      <Footer />
      <EmergencyButton />
    </div>
  );
};

export default Index;
