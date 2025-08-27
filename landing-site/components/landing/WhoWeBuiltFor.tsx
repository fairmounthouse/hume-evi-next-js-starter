"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Users, TrendingUp, Shield, Target } from "lucide-react";

const audience = [
  {
    icon: Users,
    text: "Students and early pros leveling up interview skills."
  },
  {
    icon: TrendingUp,
    text: "Ambitious learners seeking an edge in recruiting to secure internships or full-time offers."
  },
  {
    icon: Shield,
    text: "Those wanting reps and feedback without peer pressure or high coach fees."
  },
  {
    icon: Target,
    text: "Anyone building confidence before mocks with friends or real company interviews."
  }
];

export function WhoWeBuiltFor() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <section id="who-we-built-for" data-theme="section" className="py-20 relative bg-gray-50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Built for You
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          {audience.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex items-start gap-4 p-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
              style={{ borderColor: "var(--theme-card-border)" }}
            >
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-indigo-50">
                  <item.icon className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{item.text}</p>
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
          <a href={`${appUrl}/sign-in?redirect=/dashboard`}>
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              style={{
                backgroundColor: "var(--theme-cta)",
                color: "#ffffff",
              }}
            >
              Get Your Free Session
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}