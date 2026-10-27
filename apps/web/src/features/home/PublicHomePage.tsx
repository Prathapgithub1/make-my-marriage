import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { FeaturesSection } from './sections/FeaturesSection';
import { FaqSection } from './sections/FaqSection';
import { GetStartedSection } from './sections/GetStartedSection';
import { GuestExperienceSection } from './sections/GuestExperienceSection';
import { HeroSection } from './sections/HeroSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { WeddingWebsiteSection } from './sections/WeddingWebsiteSection';
import './home.css';

export function PublicHomePage() {
  return (
    <div className="home-page" id="top">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WeddingWebsiteSection />
        <GuestExperienceSection />
        <FaqSection />
        <GetStartedSection />
      </main>
      <SiteFooter />
    </div>
  );
}
