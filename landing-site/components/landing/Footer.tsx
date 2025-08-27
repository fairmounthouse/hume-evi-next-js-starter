"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Twitter, Linkedin, Github, Mail, ArrowUpRight, Eye } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "What We Offer", href: "#what-we-offer" },
    { label: "Pricing", href: "#pricing" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Team", href: "#team" }
  ],
  Company: [
    { label: "About", href: "#about" },
    { label: "Blog", href: "#blog" },
    { label: "Careers", href: "#careers" },
    { label: "Contact", href: "mailto:support@skillflo.ai" }
  ]
} as const;

const socialLinks = [
  { icon: Twitter, href: "#", label: "X" },
  { icon: Linkedin, href: "#", label: "LinkedIn" }
];

export function Footer() {
  return (
    <footer className="relative" style={{ backgroundColor: "var(--theme-footer)" }}>
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Skillflo</span>
            </div>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a key={social.label} href={social.href} aria-label={social.label} className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors duration-200" whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-white/70 hover:text-white transition-colors duration-200 text-sm flex items-center gap-1 group">
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/20">
          <p className="text-sm text-white/70">Skillflo.ai © 2025</p>
          <div className="flex items-center gap-6">
            <Link href="#privacy" className="text-sm text-white/70 hover:text-white transition-colors duration-200">Privacy</Link>
            <Link href="#terms" className="text-sm text-white/70 hover:text-white transition-colors duration-200">Terms</Link>
            <Link href="mailto:support@skillflo.ai" className="text-sm text-white/70 hover:text-white transition-colors duration-200">Contact: support@skillflo.ai</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

