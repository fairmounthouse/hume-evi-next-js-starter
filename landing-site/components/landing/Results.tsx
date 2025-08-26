"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Star, TrendingUp, Users, Award, ArrowRight, Quote, AlertTriangle, CheckCircle2 } from "lucide-react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

const testimonials = [
  {
    title: "The Ceiling-Starer",
    school: "Wharton '24",
    content: "Never knew I looked up when thinking. Every partner noticed—'lacks presence.' AI caught it in 30 seconds. Fixed in a week. McKinsey offer.",
    issue: "Eye contact during thinking",
    result: "McKinsey offer",
    highlight: "Fixed in 1 week",
    color: "from-blue-500 to-purple-500"
  },
  {
    title: "The Speed-Talker",
    school: "HBS '24",
    content: "Rejection feedback: 'Seemed nervous.' The AI showed I sped up 40% under pressure. Learned to breathe and pause. BCG: 'Exceptionally composed.'",
    issue: "Speech speed under pressure",
    result: "BCG offer",
    highlight: "40% speech improvement",
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "The Defender",
    school: "INSEAD '24",
    content: "Crossed arms every time they challenged me. Came off arrogant. AI trained it out.",
    issue: "Defensive body language",
    result: "Bain offer",
    highlight: "Body language fixed",
    color: "from-pink-500 to-red-500"
  }
];

const comparisons = [
  { category: "Other Platforms", focus: "Practice cases", limitation: "Can't see your tells" },
  { category: "Mock Partners", focus: "Practice interviews", limitation: "Too polite to mention" },
  { category: "Us", focus: "Practice performing under scrutiny", limitation: "Nothing hidden" }
];

export function Results() {
  return (
    <section id="results" className="relative py-24 bg-white overflow-hidden">
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
            Real People.
            <span className="block mt-2 text-green-600">Real Blind Spots. Real Offers.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every story starts the same: "I had no idea I was doing this."
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative h-full rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="h-2 bg-indigo-600" />
                <div className="p-8">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{testimonial.title}</h3>
                    <p className="text-sm text-gray-500">{testimonial.school}</p>
                  </div>
                  <Quote className="w-8 h-8 text-gray-200 mb-3" />
                  <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Issue:</span>
                      <span className="font-medium text-red-600">{testimonial.issue}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Result:</span>
                      <span className="font-bold text-green-600">{testimonial.result}</span>
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700">{testimonial.highlight}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-16"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">Why This Changes Everything</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {comparisons.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-xl bg-white border border-gray-200"
              >
                <h4 className="font-bold text-gray-900 mb-2">{item.category}:</h4>
                <p className="text-gray-600 mb-3">{item.focus}</p>
                <p className="text-sm text-red-600 font-medium">{item.limitation}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 p-6 rounded-xl bg-gray-900 text-white text-center">
            <p className="text-lg font-semibold mb-2">The difference?</p>
            <p className="text-xl md:text-2xl font-bold">We catch the 50 unconscious behaviors that get you rejected.</p>
            <p className="text-gray-300 mt-2">
              The ones you'll never see yourself. The ones friends won't mention.
              <span className="text-amber-400 font-semibold"> The ones that cost you $200K+.</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-12 md:p-16 text-center">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Start Your Reality Check</h3>
              <p className="text-xl text-white/90 mb-2 font-semibold">5-Minute Live Mock Interview</p>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">With full video analysis, real-time coaching, and detailed breakdown</p>
              <div className="grid md:grid-cols-4 gap-4 mb-8 max-w-3xl mx-auto">
                <div className="p-3 rounded-lg bg-white/20 backdrop-blur"><p className="text-white text-sm">Your top 3 rejection triggers</p></div>
                <div className="p-3 rounded-lg bg-white/20 backdrop-blur"><p className="text-white text-sm">Exactly how you look under pressure</p></div>
                <div className="p-3 rounded-lg bg-white/20 backdrop-blur"><p className="text-white text-sm">What partners see that you don't</p></div>
                <div className="p-3 rounded-lg bg-white/20 backdrop-blur"><p className="text-white text-sm">Your personalized fix-it plan</p></div>
              </div>
              <a href={`${appUrl}/sign-in?redirect=/dashboard`}>
                <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5">
                  See Your Blind Spots Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <div className="mt-6 p-4 rounded-lg bg-amber-500/20 backdrop-blur border border-amber-400/30">
                <p className="text-white font-semibold flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Warning: You won't like what you see. But you'll love what you become.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-20 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">The Bottom Line</h3>
          <p className="text-lg text-gray-600 mb-4">Every year, thousands of MBAs get rejected for "communication" and "presence" without knowing what that means.</p>
          <p className="text-xl font-semibold text-gray-900 mb-8">
            For the first time, you can see exactly what they see.
            <span className="block mt-2 text-blue-600">And fix it before it costs you an offer.</span>
          </p>
          <a href={`${appUrl}/sign-in?redirect=/dashboard`}>
            <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200">
              Start Your Interview →
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

