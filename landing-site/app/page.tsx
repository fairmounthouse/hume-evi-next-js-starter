"use client";

import { Hero } from "../components/landing/Hero";
import { Problem } from "../components/landing/Problem";
import { Solution } from "../components/landing/Solution";
import { Transformation } from "../components/landing/Transformation";
import { Results } from "../components/landing/Results";
import { Footer } from "../components/landing/Footer";
import ThemePalette from "../components/ThemePalette";

export default function Landing() {
  return (
    <main className="relative">
      <Hero />
      <Problem />
      <Solution />
      <Transformation />
      <Results />
      <Footer />
      <ThemePalette />
    </main>
  );
}

