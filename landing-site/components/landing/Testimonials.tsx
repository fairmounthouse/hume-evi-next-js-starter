"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "Skillflo gave me hours of lifelike case coaching early in recruiting. Built my confidence for peer mocks and helped me excel in the recruiting process.",
    author: "Tyson C.",
    title: "INSEAD MBA '25"
  },
  {
    quote: "Embarrassed to practice with classmates initially, I used Skillflo for real-feel sessions. Gave me a huge head start.",
    author: "Jennifer K.",
    title: "UCLA Econ BA '25"
  },
  {
    quote: "AI mock and coaching interview sessions felt real and more helpful than peer interviews and much cheaper than $400/hr coaches.",
    author: "Josh C.",
    title: "MIT Sloan MBA '25"
  },
  {
    quote: "As an ex-McKinsey coach, Skillflo runs cases like a pro with detailed feedback. Great for beginners or experienced.",
    author: "AC G.",
    title: "Ex-McKinsey/INSEAD '19"
  }
];

export function Testimonials() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <section id="testimonials" data-theme="section" className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Real Stories from Users
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative p-8 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
              style={{ borderColor: "var(--theme-card-border)" }}
            >
              <Quote className="absolute top-6 left-6 h-8 w-8 text-indigo-200" />
              
              <div className="flex items-center gap-1 mb-4 ml-12">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-gray-700 leading-relaxed mb-6 ml-12">
                "{testimonial.quote}"
              </blockquote>
              
              <div className="ml-12">
                <cite className="not-italic">
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.title}</div>
                </cite>
              </div>
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
              Join Them - Free Session Included
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}