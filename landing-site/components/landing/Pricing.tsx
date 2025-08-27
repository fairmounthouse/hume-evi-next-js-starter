"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Check, Star, Crown, Zap } from "lucide-react";

const pricingTiers = [
  {
    name: "Summer Intern",
    price: "$5",
    period: "/month (tools)",
    topUp: "$10/30 mins ($0.33/min)",
    description: "For casual access & occasional reps.",
    icon: Star,
    popular: false,
    features: [
      "Access to tools & modules",
      "Top-up pricing available",
      "Basic interview practice",
      "Community support"
    ]
  },
  {
    name: "Analyst Track",
    price: "$5",
    period: "/month (tools)",
    oneTime: "+ $50 one-time",
    credits: "150 credits (~5 sessions) +30 bonus ($0.28/min)",
    description: "Beginners testing",
    icon: Zap,
    popular: true,
    features: [
      "All Summer Intern features",
      "150 interview credits",
      "30 bonus credits",
      "Priority support",
      "Detailed feedback reports"
    ]
  },
  {
    name: "Associate Track",
    price: "$5",
    period: "/month (tools)",
    oneTime: "+ $100 one-time",
    credits: "300 credits (~10 sessions) +75 bonus ($0.24/min)",
    description: "Committed preppers",
    icon: Crown,
    popular: false,
    features: [
      "All Analyst Track features",
      "300 interview credits",
      "75 bonus credits",
      "Advanced analytics",
      "Custom interview scenarios"
    ]
  },
  {
    name: "Partner Track",
    price: "$150",
    period: "/month (3 mo. min)",
    credits: "600 credits (~20 sessions) +120 bonus ($0.21/min)",
    description: "Intensive users",
    icon: Crown,
    popular: false,
    features: [
      "All Associate Track features",
      "600 interview credits",
      "120 bonus credits",
      "Dedicated support",
      "Custom coaching plans",
      "Progress tracking"
    ]
  }
];

export function Pricing() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <section id="pricing" data-theme="section" className="py-20 relative bg-gray-50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Flexible Pricing to Fit Your Prep
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
            All packages include free access to tools & modules (coming soon). Each session averages 20-30 mins (20-30 credits).
          </p>
          <p className="text-lg font-semibold text-gray-900">
            Sign up now for 1 free session to test before buying.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative p-8 rounded-xl bg-white border-2 hover:shadow-lg transition-all duration-300 ${
                tier.popular 
                  ? 'border-indigo-500 shadow-lg scale-105' 
                  : 'border-gray-200'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <tier.icon className={`mx-auto mb-4 h-8 w-8 ${tier.popular ? 'text-indigo-600' : 'text-gray-600'}`} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-600">{tier.period}</span>
                  {tier.oneTime && (
                    <div className="text-sm text-gray-600 mt-1">{tier.oneTime}</div>
                  )}
                </div>
                {tier.topUp && (
                  <p className="text-sm text-gray-600 mb-2">{tier.topUp}</p>
                )}
                {tier.credits && (
                  <p className="text-sm text-gray-600 mb-2">{tier.credits}</p>
                )}
                <p className="text-gray-600">{tier.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <a href={`${appUrl}/sign-in?redirect=/dashboard`}>
                <Button
                  className={`w-full h-12 font-semibold text-base transition-all duration-200 ${
                    tier.popular
                      ? 'text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'border-2 border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                  style={tier.popular ? {
                    backgroundColor: "var(--theme-cta)",
                    color: "#ffffff",
                  } : {}}
                  variant={tier.popular ? "default" : "outline"}
                >
                  Select
                </Button>
              </a>
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
          <p className="text-gray-600 mb-4">
            Top up anytime: $5 for 15 credits.
          </p>
          <p className="text-lg font-semibold text-gray-900 mb-8">
            Not sure? Try one mock interview and coaching session now!
          </p>
          
          <a href={`${appUrl}/sign-in?redirect=/dashboard`}>
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              style={{
                backgroundColor: "var(--theme-cta)",
                color: "#ffffff",
              }}
            >
              Start with Free Session
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}