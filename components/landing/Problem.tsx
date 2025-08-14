"use client";

import { motion } from "framer-motion";
import { AlertCircle, Brain, Clock, XCircle } from "lucide-react";

const problems = [
  {
    icon: Brain,
    title: "You memorize 50 STAR stories",
    description: "Spending weeks crafting perfect responses that sound rehearsed and inauthentic",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: XCircle,
    title: "You freeze on follow-ups",
    description: "When interviewers go off-script, your rehearsed answers fall apart",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Clock,
    title: "Generic feedback wastes time",
    description: '"Be more specific" doesn\'t help when you don\'t know what specific means',
    color: "from-purple-500 to-pink-500",
  },
];

export function Problem() {
  return (
    <section id="problem" className="relative py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200/50 text-red-700 text-sm font-medium mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>The Problem</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Traditional Prep Creates{" "}
            <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Polished Robots
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            You're not failing interviews because you lack experience. You're failing because you sound scripted.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group"
            >
              <div className="relative h-full p-8 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300">
                {/* Gradient background on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative">
                  {/* Icon with gradient background */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${problem.color} mb-4`}>
                    <problem.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {problem.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {problem.description}
                  </p>
                </div>

                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-100 to-transparent rounded-bl-full opacity-50" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reality Check Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-8 md:p-12">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-4">
                <AlertCircle className="w-4 h-4" />
                <span>Reality Check</span>
              </div>
              <p className="text-xl md:text-2xl text-white leading-relaxed">
                <span className="font-bold text-yellow-400">Real interviews are dynamic conversations,</span>{" "}
                not Q&A sessions. When you sound scripted, interviewers tune out. 
                You need practice that mirrors reality—where every answer shapes the next question.
              </p>
            </div>

            {/* Animated gradient orbs */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-pulse" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}