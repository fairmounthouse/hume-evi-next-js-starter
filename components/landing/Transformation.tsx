"use client";

import { motion } from "framer-motion";
import { TrendingUp, CheckCircle, AlertCircle, Zap, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const sessions = [
  {
    number: 1,
    status: "baseline",
    feedback: "You say 'um' 31 times. Break eye contact during every calculation. Defensive posture when challenged.",
    metrics: {
      fillerWords: 31,
      eyeContact: "23%",
      confidence: "Low"
    }
  },
  {
    number: 5,
    status: "improving",
    feedback: "Filler words down 75%. Maintaining eye contact. But you still rush when nervous—focus there.",
    metrics: {
      fillerWords: 8,
      eyeContact: "67%",
      confidence: "Medium"
    }
  },
  {
    number: 10,
    status: "ready",
    feedback: "Partner-ready. Book your McKinsey interview.",
    metrics: {
      fillerWords: 2,
      eyeContact: "92%",
      confidence: "High"
    }
  }
];

const coachingExamples = [
  {
    context: "MID-CALCULATION",
    feedback: "Stop. You're looking at the ceiling. Partners think you're making it up. Eyes on me. Restart.",
    icon: "👁️",
    color: "from-red-500 to-orange-500"
  },
  {
    context: "DURING PUSHBACK",
    feedback: "Your voice just cracked. Take a breath. Lower your tone. Say that again with authority.",
    icon: "🎤",
    color: "from-orange-500 to-yellow-500"
  },
  {
    context: "STRUCTURING",
    feedback: "You're over-explaining because you're unsure. Confident people are concise. Cut it in half.",
    icon: "✂️",
    color: "from-yellow-500 to-green-500"
  }
];

const analysisFeatures = [
  "Video replay with annotations: See every tell marked",
  "Moment-by-moment breakdown: When/why you lost credibility",
  "Specific fixes: Not 'be more confident' but 'plant feet, lower voice 10%, pause before answering'",
  "Weakness heat map: Know exactly what to practice"
];

export function Transformation() {
  return (
    <section id="transformation" className="relative py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Every Session 
            <span className="block mt-2 text-green-600">
              Builds on the Last
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch yourself transform from nervous candidate to confident consultant. 
            Our AI tracks every improvement and pushes you exactly where you need it.
          </p>
        </motion.div>

        {/* Progress Timeline */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {sessions.map((session, index) => (
              <motion.div
                key={session.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Connection line */}
                {index < sessions.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 z-0" />
                )}
                
                <div className="relative z-10">
                  {/* Session number */}
                  <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center font-bold text-white text-2xl
                    ${session.status === 'baseline' ? 'bg-red-500' : 
                      session.status === 'improving' ? 'bg-amber-500' :
                      'bg-green-500'}`}>
                    #{session.number}
                  </div>
                  
                  {/* Feedback card */}
                  <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-gray-900 mb-3">Mock Interview #{session.number}</h3>
                    <p className="text-sm text-gray-600 mb-4 italic">"{session.feedback}"</p>
                    
                    {/* Metrics */}
                    <div className="space-y-2 pt-4 border-t border-gray-100">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Filler Words:</span>
                        <span className={`font-bold ${session.metrics.fillerWords > 20 ? 'text-red-600' : session.metrics.fillerWords > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {session.metrics.fillerWords}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Eye Contact:</span>
                        <span className="font-bold text-gray-900">{session.metrics.eyeContact}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Confidence:</span>
                        <span className={`font-bold ${session.metrics.confidence === 'High' ? 'text-green-600' : session.metrics.confidence === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                          {session.metrics.confidence}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Real-time Coaching */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-20"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">
            Real-Time Coaching That Changes Everything:
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {coachingExamples.map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-xl bg-gray-900 p-6 text-white"
              >
                {/* Background accent */}
                <div className="absolute inset-0 opacity-10 bg-indigo-600" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{example.icon}</span>
                    <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                      {example.context}:
                    </p>
                  </div>
                  
                  <p className="text-sm leading-relaxed">
                    "{example.feedback}"
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Detailed Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Detailed Analysis That Actually Helps
            </h3>
            
            <p className="text-lg text-gray-600 mb-8">
              Not "Work on Communication" But "Here's Exactly What to Fix"
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {analysisFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{feature}</p>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center">
              <Link href="/interview">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md">
                  Start Your Transformation
                  <Zap className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}