"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { ArrowRight, Play, Eye } from "lucide-react";

export function Hero() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white">
      {/* Animated background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <motion.div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full filter blur-3xl opacity-40"
          style={{ backgroundImage: "linear-gradient(to bottom right, var(--theme-hero), var(--theme-accent))" }}
          animate={{ x: [0, 200, 0], y: [0, -150, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full filter blur-3xl opacity-40"
          style={{ backgroundImage: "linear-gradient(to bottom right, var(--theme-hero), var(--theme-accent))" }}
          animate={{ x: [0, -200, 0], y: [0, 150, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full filter blur-3xl opacity-30"
          style={{ backgroundImage: "linear-gradient(to bottom right, var(--theme-hero), var(--theme-accent))" }}
          animate={{ scale: [1, 1.4, 1], rotate: [0, 360], x: [0, 100, -100, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-20 right-1/4 w-40 h-40 rounded-full filter blur-2xl opacity-30"
          style={{ backgroundImage: "linear-gradient(to bottom right, var(--theme-hero), var(--theme-accent))" }}
          animate={{ y: [0, -50, 0], x: [0, 30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-40 h-40 rounded-full filter blur-2xl opacity-30"
          style={{ backgroundImage: "linear-gradient(to bottom right, var(--theme-hero), var(--theme-accent))" }}
          animate={{ y: [0, 50, 0], x: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      {/* Navigation Bar */}
      <nav data-theme="header" className="absolute top-0 left-0 right-0 z-40 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
              style={{ backgroundImage: "linear-gradient(to bottom right, var(--theme-hero), var(--theme-accent))" }}
            >
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">Skillflo</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#what-we-offer" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">What We Offer</a>
            <a href="#who-we-built-for" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">For You</a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Testimonials</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</a>
            <div className="flex items-center gap-3">
              <a href={`${appUrl}/sign-in?redirect=/dashboard`} className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign in</a>
              <a href={`${appUrl}/sign-up?redirect=/dashboard`} className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign up</a>
            </div>
            <a href={`${appUrl}/sign-in?redirect=/dashboard`}>
              <Button
                className="px-6 shadow-md hover:shadow-lg transition-all"
                style={{
                  backgroundColor: "var(--theme-cta)",
                  color: "#ffffff",
                }}
              >
                Start Real Practice
              </Button>
            </a>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-6 py-24 mt-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-xl">
            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="block">Your Friends Can't</span>
              <span
                className="block bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(to right, var(--theme-cta), var(--theme-accent))"
                }}
              >
                Save You.
              </span>
              <span className="block mt-4">They Don't Know How.</span>
            </motion.h1>
            <motion.p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Peer mocks miss what matters. Our AI learned from people who've hired thousands at MBB/FAANG—and conversations like them. Real dialogue, brutal honesty, YOUR gaps fixed. Not $300/hr generic advice.
            </motion.p>
            <motion.p className="text-xl font-semibold text-gray-900 mb-8">
              The only AI that actually talks. 90% cheaper. 3x more effective.
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-4 mb-12">
              <a href={`${appUrl}/sign-in?redirect=/dashboard`}>
                <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200" style={{ backgroundColor: "var(--theme-cta)", color: "#ffffff" }}>
                  Start Real Practice <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Right Column - Demo Placeholder */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="relative">
            <div data-hero-card="true" className="rounded-2xl border p-8 shadow-sm bg-gray-50">
              <div className="aspect-video bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <Play className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-lg font-medium text-gray-600">Demo Placeholder</p>
                  <p className="text-sm text-gray-500 mt-2">Interactive AI interview experience</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

