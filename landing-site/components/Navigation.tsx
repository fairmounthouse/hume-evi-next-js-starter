'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import Logo from './Logo'

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 50) // Change background after 50px scroll
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    setIsMobileMenuOpen(false) // Close mobile menu when navigating
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      const headerHeight = 100 // Account for fixed header height
      const targetPosition = targetElement.offsetTop - headerHeight
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      })
    }
  }
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white shadow-[0_4px_0_rgba(0,0,0,0.1)]' 
        : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-8 py-5 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 text-2xl font-black text-black">
          <Logo width={38} height={77} />
          skillflo
        </Link>
        
        <ul className="hidden md:flex gap-6 lg:gap-8 list-none">
          <li><Link href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="text-black font-semibold hover:text-blue-accent transition-colors">Features</Link></li>
          <li><Link href="#built-for-you" onClick={(e) => handleSmoothScroll(e, 'built-for-you')} className="text-black font-semibold hover:text-blue-accent transition-colors">Built for You</Link></li>
          <li><Link href="#testimonials" onClick={(e) => handleSmoothScroll(e, 'testimonials')} className="text-black font-semibold hover:text-blue-accent transition-colors">Testimonials</Link></li>
          <li><Link href="#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')} className="text-black font-semibold hover:text-blue-accent transition-colors">Pricing</Link></li>
          <li><Link href="#team" onClick={(e) => handleSmoothScroll(e, 'team')} className="text-black font-semibold hover:text-blue-accent transition-colors">Team</Link></li>
        </ul>
        
        <div className="flex items-center gap-4">
          {/* Desktop buttons */}
          <div className="hidden md:flex gap-4">
            <button 
              className="btn-neubrutalist btn-white"
              onClick={() => window.open('https://app.skillflo.ai', '_blank')}
            >
              Log in
            </button>
            <button 
              className="btn-neubrutalist btn-secondary"
              onClick={() => window.open('https://app.skillflo.ai', '_blank')}
            >
              Start Free
            </button>
          </div>
          
          {/* Mobile hamburger menu */}
          <button 
            className="md:hidden flex flex-col gap-1 p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`w-6 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
          </button>
        </div>
      </nav>
      
      {/* Mobile menu */}
      <div className={`md:hidden bg-white border-t-2 border-black transition-all duration-300 ${
        isMobileMenuOpen ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <nav className="px-6 sm:px-8 py-6">
          <ul className="space-y-4">
            <li><Link href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="block text-black font-semibold hover:text-blue-accent transition-colors py-2">Features</Link></li>
            <li><Link href="#built-for-you" onClick={(e) => handleSmoothScroll(e, 'built-for-you')} className="block text-black font-semibold hover:text-blue-accent transition-colors py-2">Built for You</Link></li>
            <li><Link href="#testimonials" onClick={(e) => handleSmoothScroll(e, 'testimonials')} className="block text-black font-semibold hover:text-blue-accent transition-colors py-2">Testimonials</Link></li>
            <li><Link href="#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')} className="block text-black font-semibold hover:text-blue-accent transition-colors py-2">Pricing</Link></li>
            <li><Link href="#team" onClick={(e) => handleSmoothScroll(e, 'team')} className="block text-black font-semibold hover:text-blue-accent transition-colors py-2">Team</Link></li>
          </ul>
          
          <div className="flex flex-col gap-3 mt-6">
            <button 
              className="btn-neubrutalist btn-white w-full"
              onClick={() => window.open('https://app.skillflo.ai', '_blank')}
            >
              Log in
            </button>
            <button 
              className="btn-neubrutalist btn-secondary w-full"
              onClick={() => window.open('https://app.skillflo.ai', '_blank')}
            >
              Start Free
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}
