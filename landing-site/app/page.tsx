"use client";

import { Hero } from "../components/landing/Hero";
import { WhatWeOffer } from "../components/landing/WhatWeOffer";
import { WhoWeBuiltFor } from "../components/landing/WhoWeBuiltFor";
import { Testimonials } from "../components/landing/Testimonials";
import { Pricing } from "../components/landing/Pricing";
import { Team } from "../components/landing/Team";
import { Footer } from "../components/landing/Footer";
import ThemePalette from "../components/ThemePalette";

export default function Landing() {
  return (
    <main className="relative">
      <Hero />
      <WhatWeOffer />
      <WhoWeBuiltFor />
      <Testimonials />
      <Pricing />
      <Team />
      <Footer />
      <ThemePalette />
    </main>
  );
}

