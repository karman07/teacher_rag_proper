import Navbar from "./components/landing/Navbar";
import Hero from "./components/landing/Hero";
import Features from "./components/landing/Features";
import HowItWorks from "./components/landing/HowItWorks";
import Testimonials from "./components/landing/Testimonials";
import FAQSection from "./components/landing/FAQSection";
import Footer from "./components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
