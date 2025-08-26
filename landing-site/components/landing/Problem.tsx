"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Eye, TrendingUp, XCircle, ChevronRight } from "lucide-react";

const invisibleFailures = [
  {
    icon: "😰",
    title: "Your shoulders tense",
    description: "Partners read: defensive",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: "📈",
    title: "Your voice rises",
    description: "Partners think: uncertain",
    color: "from-orange-500 to-yellow-500",
  },
  {
    icon: "👀",
    title: "You break eye contact",
    description: "Partners see: not confident",
    color: "from-yellow-500 to-red-500",
  },
  {
    icon: "⏩",
    title: "You speed up",
    description: "Partners know: panicking",
    color: "from-red-500 to-pink-500",
  },
];

export function Problem() {
  return (
    <section id="problem" className="relative py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            You Know Every Framework.
            <span className="block mt-2">
              So Why Do They Keep Saying{" "}
              <span className="text-red-600">
                "Not Quite Ready"?
              </span>
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Because this isn't about knowledge. It's about how you react when a partner says:
          </p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-6 p-6 bg-gray-900 text-white rounded-xl max-w-2xl mx-auto"
          >
            <p className="text-lg md:text-xl font-semibold italic">
              "Your math is wrong. Explain your logic."
            </p>
          </motion.div>
        </motion.div>

        {/* The Invisible Failures */}
        <div className="max-w-5xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              The Invisible Failures:
            </h3>
            <p className="text-lg text-gray-600">
              Partners see it all. You see none of it. <span className="font-semibold">Until now.</span>
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {invisibleFailures.map((failure, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group"
              >
                <div className="relative h-full p-6 rounded-2xl bg-white border border-gray-200 border-theme shadow-sm hover:shadow-md transition-all duration-300">
                  {/* Emoji icon */}
                  <div className="text-4xl mb-4">{failure.icon}</div>
                  
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {failure.title}
                  </h4>
                  
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-gray-600 font-medium">
                      {failure.description}
                    </p>
                  </div>

                  {/* Subtle accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Reality Check Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gray-900 p-8 md:p-12">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 backdrop-blur flex items-center justify-center">
                  <Eye className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">The Hard Truth</h3>
              </div>
              
              <p className="text-lg md:text-xl text-gray-100 leading-relaxed mb-6">
                Every year, thousands of MBAs master every framework, ace every practice case, 
                and still get rejected. Why?
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-white/10 backdrop-blur">
                  <p className="text-3xl font-bold text-white mb-2">73%</p>
                  <p className="text-sm text-gray-300">
                    Fail due to "presence" issues they never knew existed
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/10 backdrop-blur">
                  <p className="text-3xl font-bold text-white mb-2">0%</p>
                  <p className="text-sm text-gray-300">
                    Can see their own body language tells during interviews
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/10 backdrop-blur">
                  <p className="text-3xl font-bold text-white mb-2">$200K+</p>
                  <p className="text-sm text-gray-300">
                    Average cost of these invisible mistakes per candidate
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

