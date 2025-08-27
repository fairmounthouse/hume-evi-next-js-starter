"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { GraduationCap, Briefcase, Award } from "lucide-react";

export function Team() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <section id="team" data-theme="section" className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Meet the Team Behind Skillflo
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 shadow-sm">
            
            <div className="text-center">
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                We're former hiring managers with degrees from MIT, UC Berkeley, and UCLA. We've secured roles at banks, consulting firms, and big tech through hard work and smart prep. Now, we're building Skillflo to give you the same edge—because we've walked in your shoes.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-12"
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
              Get Started - Free Session Awaits
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}