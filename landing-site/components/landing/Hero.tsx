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
        <motion.div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 rounded-full filter blur-3xl opacity-40" animate={{ x: [0, 200, 0], y: [0, -150, 0], scale: [1, 1.3, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 rounded-full filter blur-3xl opacity-40" animate={{ x: [0, -200, 0], y: [0, 150, 0], scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 rounded-full filter blur-3xl opacity-30" animate={{ scale: [1, 1.4, 1], rotate: [0, 360], x: [0, 100, -100, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute top-20 right-1/4 w-40 h-40 bg-gradient-to-br from-indigo-300 to-purple-300 rounded-full filter blur-2xl opacity-30" animate={{ y: [0, -50, 0], x: [0, 30, 0], scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full filter blur-2xl opacity-30" animate={{ y: [0, 50, 0], x: [0, -30, 0], scale: [1, 1.1, 1] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-40 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">CaseCoach AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">The Problem</a>
            <a href="#solution" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Our Solution</a>
            <a href="#transformation" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Your Journey</a>
            <a href="#results" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Success Stories</a>
            <a href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</a>
            <div className="flex items-center gap-3">
              <a href={`${appUrl}/sign-in?redirect=/dashboard`} className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign in</a>
              <a href={`${appUrl}/sign-up?redirect=/dashboard`} className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign up</a>
            </div>
            <a href={`${appUrl}/sign-in?redirect=/dashboard`}>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 shadow-md hover:shadow-lg transition-all">Start Mock Interview</Button>
            </a>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-6 py-24 mt-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-xl">
            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="block">You're Training</span>
              <span className="block">for a Test.</span>
              <span className="block mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">They're Running</span>
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">an Audition.</span>
            </motion.h1>
            <motion.div className="flex flex-col sm:flex-row gap-4 mb-12">
              <a href={`${appUrl}/sign-in?redirect=/dashboard`}>
                <Button size="lg" className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                  <Eye className="mr-2 h-4 w-4" /> Start Your Reality Check
                </Button>
              </a>
              <a href={`${appUrl}/interview/setup`}>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                  <Play className="mr-2 h-4 w-4" /> 5-Minute Live Mock
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Right Column - What We Catch Card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="relative">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-600">Live analysis</span>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">What partners see</h3>
                <div className="space-y-4">
                  <motion.div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Looking at ceiling during math</p>
                      <p className="text-xs text-gray-600 mt-1">Making it up as they go</p>
                    </div>
                  </motion.div>
                  <motion.div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Voice rises when challenged</p>
                      <p className="text-xs text-gray-600 mt-1">Not confident in answer</p>
                    </div>
                  </motion.div>
                  <motion.div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Shoulders tense up</p>
                      <p className="text-xs text-gray-600 mt-1">Defensive, not coachable</p>
                    </div>
                  </motion.div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <motion.div className="p-4 rounded-xl bg-white border border-gray-200" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}>
                  <p className="text-3xl font-bold text-gray-900">50+</p>
                  <p className="text-xs text-gray-700 font-medium mt-1">Behavioral Tells Tracked</p>
                </motion.div>
                <motion.div className="p-4 rounded-xl bg-white border border-gray-200" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 }}>
                  <p className="text-3xl font-bold text-gray-900">Real-time</p>
                  <p className="text-xs text-gray-700 font-medium mt-1">Coaching Feedback</p>
                </motion.div>
              </div>
              <a href={`${appUrl}/sign-in?redirect=/dashboard`} className="block">
                <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors text-base">
                  See Your Blind Spots Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

