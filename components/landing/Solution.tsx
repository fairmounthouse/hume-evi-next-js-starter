"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  Target, 
  Brain, 
  Zap, 
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Users,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    id: "dynamic",
    icon: MessageSquare,
    title: "Dynamic Conversations",
    shortDescription: "No two interviews are the same. Our AI adapts its questions based on your answers.",
    fullDescription: "Experience real interview dynamics where your responses shape the conversation. Our AI picks up on subtle cues, asks relevant follow-ups, and challenges you just like a seasoned interviewer would.",
    stats: { label: "Unique Paths", value: "∞" },
    color: "from-blue-500 to-cyan-500",
    example: {
      ai: "Tell me about a time you led a difficult project.",
      user: "I led a team of 5 engineers to rebuild our payment system...",
      followUp: "Interesting. How did you handle the engineer who initially resisted the new architecture?",
      insight: "AI picked up on unstated tension and probed deeper"
    }
  },
  {
    id: "feedback",
    icon: Target,
    title: "Feedback That Actually Helps",
    shortDescription: "Get specific, actionable feedback on exactly what to improve—not generic advice.",
    fullDescription: "Receive detailed analysis of your responses with concrete examples of how to improve. Our AI identifies patterns in your answers and provides targeted coaching.",
    stats: { label: "Improvement Rate", value: "94%" },
    color: "from-purple-500 to-pink-500",
    example: {
      weak: "Your answer needs more detail",
      strong: "You mentioned 'improving efficiency' 3 times but never quantified it. Try: 'reduced processing time from 48 to 12 hours, saving $200K annually'"
    }
  },
  {
    id: "intelligence",
    icon: Brain,
    title: "Intelligence from Real Interviews",
    shortDescription: "Trained on actual interviews from top companies, our AI knows what hiring managers really look for.",
    fullDescription: "Built on a foundation of thousands of real interview transcripts, our AI understands the nuances that separate good answers from great ones.",
    stats: { label: "Hours Analyzed", value: "10K+" },
    color: "from-green-500 to-emerald-500",
    metrics: [
      { value: "10,000+", label: "Hours of interviews analyzed" },
      { value: "500+", label: "Companies represented" },
      { value: "95%", label: "Accuracy in predicting success" }
    ]
  }
];

export function Solution() {
  const [activeFeature, setActiveFeature] = useState("dynamic");
  const selectedFeature = features.find(f => f.id === activeFeature)!;

  return (
    <section id="solution" className="relative py-24 bg-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-blue-50 via-transparent to-purple-50 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200/50 text-green-700 text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            <span>The Solution</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AI That Interviews Like{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Humans Do
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Stop memorizing. Start conversing. Get hired.
          </p>
        </motion.div>

        {/* Interactive Feature Showcase */}
        <div className="max-w-6xl mx-auto">
          {/* Feature Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {features.map((feature) => (
              <motion.button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`group relative px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeFeature === feature.id
                    ? "bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-md"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <feature.icon className="w-5 h-5" />
                  <span>{feature.title}</span>
                </div>
                {activeFeature === feature.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl -z-10"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Feature Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              {/* Left: Description and Stats */}
              <div>
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${selectedFeature.color} mb-6`}>
                  <selectedFeature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedFeature.title}
                </h3>
                
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {selectedFeature.fullDescription}
                </p>

                {/* Stats or Metrics */}
                {selectedFeature.metrics ? (
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {selectedFeature.metrics.map((metric, idx) => (
                      <div key={idx} className="text-center p-4 rounded-lg bg-gray-50">
                        <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                        <div className="text-sm text-gray-600 mt-1">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                ) : selectedFeature.stats && (
                  <div className="inline-flex items-center gap-4 p-4 rounded-lg bg-gray-50 mb-8">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {selectedFeature.stats.value}
                    </div>
                    <div className="text-gray-600">{selectedFeature.stats.label}</div>
                  </div>
                )}

                <Link href="/interview">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Try It Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Right: Example or Visual */}
              <div>
                {selectedFeature.example && (
                  <div className="space-y-4">
                    {selectedFeature.example.ai && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">AI Interviewer</span>
                        </div>
                        <p className="text-gray-800">{selectedFeature.example.ai}</p>
                      </motion.div>
                    )}

                    {selectedFeature.example.user && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 ml-8"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">You</span>
                        </div>
                        <p className="text-gray-800">{selectedFeature.example.user}</p>
                      </motion.div>
                    )}

                    {selectedFeature.example.followUp && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-50 border border-purple-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">AI Follow-up</span>
                        </div>
                        <p className="text-gray-800">{selectedFeature.example.followUp}</p>
                      </motion.div>
                    )}

                    {selectedFeature.example.insight && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-green-800 font-medium">
                          {selectedFeature.example.insight}
                        </p>
                      </motion.div>
                    )}

                    {selectedFeature.example.weak && (
                      <>
                        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-sm font-medium text-red-600 mb-1">Generic Feedback:</p>
                          <p className="text-gray-700">{selectedFeature.example.weak}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                          <p className="text-sm font-medium text-green-600 mb-1">Our Feedback:</p>
                          <p className="text-gray-700">{selectedFeature.example.strong}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <p className="text-lg text-gray-600 mb-6">
            Ready to experience the difference?
          </p>
          <Link href="/interview">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Start Your First Interview
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}