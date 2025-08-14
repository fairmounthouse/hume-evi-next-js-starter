"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Brain, Calendar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Hero() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-purple-50/20">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50" />
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.08) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-40 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">InterviewAI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              The Problem
            </a>
            <a href="#solution" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              How It Works
            </a>
            <a href="#results" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Success Stories
            </a>
            <Link href="/interview">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-24 mt-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Stop Practicing Interview Answers.
              <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Start Having Real Conversations.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed"
            >
              Our AI learned from 10,000+ hours of elite interviews. Now it interviews you 
              like a real hiring manager—adapting questions based on your answers, not following a script.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Link href="/interview">
                <Button
                  size="lg"
                  className="h-12 px-6 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Practicing Free
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 text-base font-semibold border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                onClick={() => setIsVideoPlaying(true)}
              >
                <Play className="mr-2 h-4 w-4" />
                Watch 90-Second Demo
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm text-gray-500 uppercase tracking-wider"
            >
              <p className="mb-3">Trusted by professionals from</p>
              <div className="flex flex-wrap items-center gap-6 opacity-70">
                <span className="text-lg font-semibold text-gray-600">Google</span>
                <span className="text-lg font-semibold text-gray-600">McKinsey</span>
                <span className="text-lg font-semibold text-gray-600">Meta</span>
                <span className="text-lg font-semibold text-gray-600">Goldman</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Interview Preview Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-100/50 to-blue-100/50 p-1">
              <div className="rounded-xl overflow-hidden bg-white/95 backdrop-blur">
                <div className="p-8">
                  {/* Status indicator */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">Ready to Interview</span>
                    </div>
                  </div>

                  {/* AI Avatar */}
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-24 h-24 mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Calendar className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Interview Assistant</h3>
                    <p className="text-gray-600">Powered by advanced emotional intelligence</p>
                  </div>

                  {/* Preview stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-blue-50/50">
                      <p className="text-2xl font-bold text-blue-600">10K+</p>
                      <p className="text-sm text-gray-600">Hours Analyzed</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50/50">
                      <p className="text-2xl font-bold text-purple-600">95%</p>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                  </div>

                  {/* Start button */}
                  <Link href="/interview" className="block">
                    <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold">
                      Begin Interview Session
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 blur-2xl"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-2xl"
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}