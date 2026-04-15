import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Stats from "./components/Stats";
import Testimonials from "./components/Testimonials";
// import Pricing from "./components/Pricing";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <Testimonials />
        {/* <Pricing /> */}
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
