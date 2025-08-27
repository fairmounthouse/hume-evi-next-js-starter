"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Mic, MessageCircle, BarChart3, Book, Puzzle } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Personalized Mocks",
    subtitle: "Case & behavioral",
    badge: "Beta",
    color: "text-indigo-600"
  },
  {
    icon: MessageCircle,
    title: "Real-Time Coaching",
    subtitle: "For interviews",
    badge: "Beta",
    color: "text-purple-600"
  },
  {
    icon: BarChart3,
    title: "Detailed Feedback",
    subtitle: "Objective & subjective",
    badge: "",
    color: "text-blue-600"
  },
  {
    icon: Book,
    title: "MBB-Inspired Cases",
    subtitle: "Full range + more coming soon",
    badge: "",
    color: "text-green-600"
  },
  {
    icon: Puzzle,
    title: "Training Materials",
    subtitle: "Frameworks, drills",
    badge: "Coming Soon",
    color: "text-orange-600"
  }
];

export function WhatWeOffer() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <section id="what-we-offer" data-theme="section" className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            What Skillflo Delivers
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300"
              style={{ borderColor: "var(--theme-card-border)" }}
            >
              {feature.badge && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {feature.badge}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-gray-50 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.subtitle}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            All powered by AI trained by ex-hiring managers—at a fraction of human coach costs.
          </p>
          <p className="text-lg font-semibold text-gray-900 mb-8">
            Not sure? Try one mock interview and coaching session now!
          </p>
          
          <a href={`${appUrl}/sign-in?redirect=/dashboard`}>
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              style={{
                backgroundColor: "var(--theme-cta)",
                color: "#ffffff",
              }}
            >
              Start Free Session
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}