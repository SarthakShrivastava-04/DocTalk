import { div } from "motion/react-client";
import Features from "./components/features-1";
import HeroSection from "./components/hero-section";
import FooterSection from "./components/footer";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <Features />
      <FooterSection/>
    </div>
  );
}
