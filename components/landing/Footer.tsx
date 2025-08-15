"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Twitter, 
  Linkedin, 
  Github,
  Mail,
  ArrowUpRight,
  Brain
} from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Success Stories", href: "#results" },
    { label: "FAQ", href: "#faq" }
  ],
  Company: [
    { label: "About", href: "#about" },
    { label: "Blog", href: "#blog" },
    { label: "Careers", href: "#careers" },
    { label: "Contact", href: "#contact" }
  ],
  Resources: [
    { label: "Interview Guide", href: "#guide" },
    { label: "Company Research", href: "#research" },
    { label: "Salary Data", href: "#salary" },
    { label: "Community", href: "#community" }
  ],
  Legal: [
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Terms of Service", href: "#terms" },
    { label: "Cookie Policy", href: "#cookies" },
    { label: "GDPR", href: "#gdpr" }
  ]
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Mail, href: "#", label: "Email" }
];

export function Footer() {
  return (
    <footer className="relative bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AI Interview Coach</span>
            </div>
            <p className="text-gray-600 mb-6 max-w-xs">
              Transform your interview skills with AI-powered practice that adapts to you.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-600 transition-colors duration-200"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-gray-900 mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section - removed per request */}

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            © 2024 AI Interview Coach. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#privacy" className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200">
              Privacy
            </Link>
            <Link href="#terms" className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200">
              Terms
            </Link>
            <Link href="#cookies" className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}