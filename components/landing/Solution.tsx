"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { 
  Eye, 
  Target, 
  Brain, 
  Zap, 
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    id: "visual",
    icon: Eye,
    title: "Live Visual Intelligence",
    shortDescription: "We're the only platform with real-time video analysis. Not just voice. Not just words. Everything.",
    fullDescription: "Our AI sees what no human coach can catch consistently - micro-expressions, posture shifts, eye movement patterns. Every tell that costs you offers.",
    color: "from-blue-500 to-purple-500",
    examples: [
      {
        trigger: "You're leaning back",
        analysis: "Defensive posture",
        perception: "Partners read as 'not coachable'"
      },
      {
        trigger: "Eyes darting during math",
        analysis: "Mental overload",
        perception: "They think you're guessing"
      },
      {
        trigger: "Touching face while explaining",
        analysis: "Classic deception tell",
        perception: "Trust destroyed"
      }
    ]
  },
  {
    id: "pressure",
    icon: Target,
    title: "Dynamic Pressure Testing",
    shortDescription: "Your interview adapts in real-time to find and exploit your weaknesses.",
    fullDescription: "Just like real partners, our AI pushes harder where you're weak. This isn't practice. It's preparation for war.",
    color: "from-purple-500 to-pink-500",
    tactics: [
      {
        condition: "Struggle with math?",
        response: "Harder calculations coming"
      },
      {
        condition: "Get defensive?",
        response: "More aggressive pushback"
      },
      {
        condition: "Freeze under pressure?",
        response: "Interruption training activated"
      }
    ]
  }
];

export function Solution() {
  const [activeFeature, setActiveFeature] = useState("visual");
  const selectedFeature = features.find(f => f.id === activeFeature)!;

  return (
    <section id="solution" className="relative py-24 bg-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
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
            What We Catch That
            <span className="block mt-2 text-indigo-600">
              No One Else Can
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Other platforms listen to your words. We analyze everything else that actually determines your offer.
          </p>
        </motion.div>

        {/* Feature Tabs */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {features.map((feature) => (
              <motion.button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`group relative px-6 py-4 rounded-xl font-medium transition-all duration-300 ${
                  activeFeature === feature.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <feature.icon className="w-5 h-5" />
                  <span className="font-semibold">{feature.title}</span>
                </div>
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
            >
              {selectedFeature.id === "visual" && (
                <div className="grid md:grid-cols-2 gap-12 items-start">
                  {/* Left: Description */}
                  <div>
                    <div className="inline-flex p-3 rounded-xl bg-indigo-600 mb-6">
                      <selectedFeature.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      {selectedFeature.title}
                    </h3>
                    
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      {selectedFeature.fullDescription}
                    </p>

                    <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">What We Catch That No One Else Can:</h4>
                      <div className="space-y-4">
                        {selectedFeature.examples?.map((example, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-semibold text-gray-900">"{example.trigger}"</span>
                                <span className="text-gray-600"> → </span>
                                <span className="text-red-600 font-medium">{example.analysis}</span>
                                <span className="text-gray-600"> → </span>
                                <span className="text-gray-900 italic">{example.perception}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Visual Demo */}
                  <div className="relative">
                    <div className="rounded-2xl overflow-hidden bg-gray-900 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-400 text-sm ml-2">Live Analysis</span>
                      </div>
                      
                      {/* Mock video frame */}
                      <div className="aspect-video bg-gray-800 rounded-lg mb-4 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-32 h-32 rounded-full bg-gray-700"></div>
                        </div>
                        
                        {/* Analysis overlays */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="absolute top-4 left-4 px-3 py-1 bg-red-500/90 text-white text-xs rounded-full"
                        >
                          ⚠️ Posture: Defensive
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                          className="absolute top-4 right-4 px-3 py-1 bg-orange-500/90 text-white text-xs rounded-full"
                        >
                          👀 Eye Contact: 43%
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.5 }}
                          className="absolute bottom-4 left-4 px-3 py-1 bg-yellow-500/90 text-white text-xs rounded-full"
                        >
                          🎤 Voice: Rising Pitch
                        </motion.div>
                      </div>
                      
                      {/* Real-time feedback */}
                      <div className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                        <p className="text-sm text-gray-300 font-mono">
                          <span className="text-red-400">[ALERT]</span> Defensive body language detected. 
                          <span className="text-yellow-400">Relax shoulders, lean slightly forward.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedFeature.id === "pressure" && (
                <div className="grid md:grid-cols-2 gap-12 items-start">
                  {/* Left: Description */}
                  <div>
                    <div className="inline-flex p-3 rounded-xl bg-indigo-600 mb-6">
                      <selectedFeature.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      {selectedFeature.title}
                    </h3>
                    
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      {selectedFeature.fullDescription}
                    </p>

                    <div className="space-y-4">
                      {selectedFeature.tactics?.map((tactic, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-4 rounded-lg bg-red-50 border border-red-200"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{tactic.condition}</p>
                            <ArrowRight className="w-4 h-4 text-red-600" />
                            <p className="font-semibold text-red-600">{tactic.response}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-gray-900 text-white">
                      <p className="text-sm font-semibold mb-2">⚔️ This isn't practice.</p>
                      <p className="text-lg font-bold">It's preparation for war.</p>
                    </div>
                  </div>

                  {/* Right: Pressure Examples */}
                  <div className="space-y-4">
                    <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">Real-Time Adaptation Example:</h4>
                      
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-white border-l-4 border-blue-500">
                          <p className="text-sm text-gray-600 mb-1">Round 1</p>
                          <p className="text-sm font-medium">Basic market sizing: "How many coffee shops in NYC?"</p>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-white border-l-4 border-yellow-500">
                          <p className="text-sm text-gray-600 mb-1">You struggle with the calculation...</p>
                          <p className="text-sm font-medium text-yellow-600">AI detects hesitation</p>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-white border-l-4 border-red-500">
                          <p className="text-sm text-gray-600 mb-1">Round 2 - Difficulty Increased</p>
                          <p className="text-sm font-medium">"Now calculate the NPV with a 12% discount rate over 5 years with varying cash flows."</p>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-gray-900 text-white">
                          <p className="text-sm font-semibold">
                            The AI found your weakness and is training you exactly where partners will attack.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link href="/sign-in?redirect=/dashboard">
              <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                Experience Real Pressure Testing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}