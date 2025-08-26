"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { CheckCircle2, Shield, Gauge, Sparkles } from "lucide-react";
import type { SVGProps } from "react";

export function Solution() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const benefits = [
    {
      title: "See What Partners See",
      description:
        "Real-time detection of unconscious tells: eye contact, vocal tone, posture, and more.",
      icon: EyeIcon,
    },
    {
      title: "Fix It Fast",
      description:
        "Targeted drills with immediate coaching cues—no vague 'communicate better' advice.",
      icon: CheckCircle2,
    },
    {
      title: "Perform Under Scrutiny",
      description:
        "Train the exact pressure moments that derail candidates in partner rounds.",
      icon: Shield,
    },
    {
      title: "Track Progress",
      description:
        "Clear metrics on filler words, pacing, eye contact and confidence over time.",
      icon: Gauge,
    },
  ];

  return (
    <section id="solution" className="relative py-24 bg-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
      </div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            The Only Coach That Sees What You Don’t
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI shows you exactly how you come across under pressure—and trains the
            behaviors that get you rejected in partner rounds.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          {benefits.map((b, index) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="relative h-full p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <b.icon className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">{b.title}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{b.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-10 md:p-14 text-center">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-semibold">Live AI Coaching</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Ready for a 5-Minute Reality Check?
              </h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Get your top rejection triggers, with immediate fixes you can practice today.
              </p>
              <a href={`${appUrl}/sign-in?redirect=/dashboard`}>
                <Button size="lg" className="h-12 px-8 text-base font-semibold bg-white text-indigo-600 hover:bg-gray-100 shadow-lg">
                  Start Mock Interview
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M12 5c-5 0-8.5 4.5-9.5 6 .9 1.5 4.5 6 9.5 6s8.6-4.5 9.5-6c-.9-1.5-4.5-6-9.5-6Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

