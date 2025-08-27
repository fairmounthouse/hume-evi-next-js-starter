'use client'

import { Mic, MessageCircle, BarChart3, Book, Puzzle } from 'lucide-react'

export default function WhatWeOffer() {
  return (
    <section id="features" className="section-padding" style={{backgroundColor: '#F7F8FA'}}>
      <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-6xl font-black mb-4 tracking-tight font-poppins">What skillflo Delivers</h2>
        <p className="text-xl lg:text-2xl text-black opacity-70">Powerful features that help you prepare, practice, and perform</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <div className="card-neubrutalist">
          <div className="icon-neubrutalist">
            <Mic className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-black">Ultra Personalized Mocks</h3>
          <p className="text-lg text-black opacity-80 leading-relaxed mb-2">
            Case & behavioral
          </p>
          <span className="inline-block bg-orange-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
            Beta
          </span>
        </div>
        
        <div className="card-neubrutalist">
          <div className="icon-neubrutalist">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-black">Real-Time Coaching</h3>
          <p className="text-lg text-black opacity-80 leading-relaxed mb-2">
            For interviews
          </p>
          <span className="inline-block bg-orange-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
            Beta
          </span>
        </div>
        
        <div className="card-neubrutalist">
          <div className="icon-neubrutalist">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-black">Actionable Feedback</h3>
          <p className="text-lg text-black opacity-80 leading-relaxed">
            Objective & subjective
          </p>
        </div>
        
        <div className="card-neubrutalist">
          <div className="icon-neubrutalist">
            <Book className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-black">MBB-Inspired Cases</h3>
          <p className="text-lg text-black opacity-80 leading-relaxed">
            Full range + more coming soon
          </p>
        </div>
        
        <div className="card-neubrutalist">
          <div className="icon-neubrutalist">
            <Puzzle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-black">Training Materials</h3>
          <p className="text-lg text-black opacity-80 leading-relaxed mb-2">
            Frameworks, drills
          </p>
          <span className="inline-block bg-blue-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
            Coming Soon
          </span>
        </div>
      </div>

      <div className="text-center mb-8">
        <p className="text-lg text-black opacity-80 mb-6 max-w-3xl mx-auto">
          All powered by AI trained by ex-hiring managers—at a fraction of human coach costs.
        </p>
        <p className="text-xl font-semibold text-black mb-8">
          Not sure? Try one mock interview and coaching session now!
        </p>
        <button 
          className="btn-neubrutalist btn-secondary text-lg px-8 py-4"
          onClick={() => window.open('https://app.skillflo.ai', '_blank')}
        >
          Start Free Session
        </button>
      </div>
      </div>
    </section>
  )
}
