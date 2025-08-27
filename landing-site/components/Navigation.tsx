'use client'

import Link from 'next/link'

export default function Navigation() {
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
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
    <header className="bg-white border-b-4 border-black fixed top-0 left-0 right-0 z-50 shadow-[0_4px_0_rgba(0,0,0,0.1)]">
      <nav className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
        <Link href="/" className="text-2xl font-black text-black">
          skillflo
        </Link>
        
        <ul className="hidden md:flex gap-8 list-none">
          <li><Link href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="text-black font-semibold hover:text-blue-accent transition-colors">Features</Link></li>
          <li><Link href="#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')} className="text-black font-semibold hover:text-blue-accent transition-colors">Pricing</Link></li>
          <li><Link href="#testimonials" onClick={(e) => handleSmoothScroll(e, 'testimonials')} className="text-black font-semibold hover:text-blue-accent transition-colors">Testimonials</Link></li>
          <li><Link href="#team" onClick={(e) => handleSmoothScroll(e, 'team')} className="text-black font-semibold hover:text-blue-accent transition-colors">Team</Link></li>
        </ul>
        
        <div className="flex gap-4">
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
      </nav>
    </header>
  )
}
