import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import B2BSection from "./components/B2BSection";
// import Pricing from "./components/Pricing";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import ResearchSection from "./components/ResearchSection";
import FAQSection from "./components/FAQSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <B2BSection />
        <ResearchSection />
        {/* <Pricing /> */}
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
