"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, Users, Award, ArrowRight, Quote } from "lucide-react";
import Link from "next/link";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager at Google",
    image: "/testimonials/sarah.jpg",
    content: "After bombing 3 interviews reading from my STAR notes, this changed everything. The AI caught me using buzzwords and taught me to tell real stories. Got offers from Google and Meta.",
    before: "0/3 offers",
    after: "2/2 offers",
    rating: 5,
    highlight: "Google & Meta offers"
  },
  {
    name: "James Park",
    role: "Senior Consultant at McKinsey",
    content: "The follow-up questions were brutal—exactly what I needed. It found every weak spot in my stories and made me fix them. Felt like sparring with a senior partner.",
    before: "Struggling with case interviews",
    after: "Dream job at McKinsey",
    rating: 5,
    highlight: "2 weeks prep time"
  },
  {
    name: "Maria Rodriguez",
    role: "Software Engineer at Microsoft",
    content: "I used to freeze during behavioral questions. The AI's adaptive questioning helped me practice thinking on my feet. Now I actually enjoy interviews!",
    before: "Anxiety & freezing up",
    after: "Confident & articulate",
    rating: 5,
    highlight: "150% salary increase"
  }
];

const stats = [
  { value: "50,000+", label: "Success Stories", icon: Users },
  { value: "94%", label: "Interview Success Rate", icon: TrendingUp },
  { value: "3.2x", label: "More Offers on Average", icon: Award },
  { value: "14 days", label: "Average Time to Offer", icon: Star }
];

export function Results() {
  return (
    <section id="results" className="relative py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-100 to-blue-100 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/50 text-blue-700 text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            <span>Success Stories</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            From Nervous to{" "}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Hired in Under 3 Weeks
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Join thousands who transformed their interview performance and landed their dream jobs.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white rounded-2xl p-6 text-center border border-gray-100 hover:border-gray-200 transition-colors duration-300">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative h-full p-8 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300">
                {/* Quote icon */}
                <Quote className="absolute top-6 right-6 w-8 h-8 text-gray-200" />
                
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 mb-6 leading-relaxed relative z-10">
                  "{testimonial.content}"
                </p>

                {/* Before/After */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Before</p>
                    <p className="text-sm font-medium text-red-600">{testimonial.before}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">After</p>
                    <p className="text-sm font-medium text-green-600">{testimonial.after}</p>
                  </div>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>

                {/* Highlight badge */}
                <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium">
                  {testimonial.highlight}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 md:p-16 text-center">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            
            {/* Animated circles */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-white rounded-full mix-blend-soft-light opacity-10 animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-white rounded-full mix-blend-soft-light opacity-10 animate-pulse" />
            
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Start Your Transformation Today
              </h3>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join 50,000+ professionals who stopped sounding like everyone else and started landing dream offers.
              </p>
              
              <Link href="/interview">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Start Free for 7 Days
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <p className="text-white/80 text-sm mt-4">
                No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </motion.div>

        {/* Final message */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center text-lg text-gray-600 mt-12 max-w-3xl mx-auto"
        >
          Stop sounding like everyone else who read the same interview guides.{" "}
          <span className="font-bold text-gray-900">Start sounding like yourself—but better.</span>
        </motion.p>
      </div>
    </section>
  );
}