'use client'

import { Mic, MessageCircle, BarChart3, Book, Puzzle, Calendar } from 'lucide-react'

export default function WhatWeOffer() {
  return (
    <section id="features" className="section-padding w-full overflow-x-hidden" style={{backgroundColor: '#F7F8FA'}}>
      <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-6xl font-black mb-4 tracking-tight font-poppins">What Skillflo Delivers</h2>
        <p className="text-xl lg:text-2xl text-black opacity-70">Powerful features that help you prepare, practice, and perform</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <div className="card-neubrutalist">
          <div className="icon-neubrutalist">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-black">Real-Time Coaching</h3>
          <p className="text-lg text-black opacity-80 leading-relaxed mb-2">
            <span className="badge badge-beta">Beta</span>
          </p>
          <p className="text-base text-black opacity-80 italic">
            Want to perfect your pitch in real time? Coach mode guides you step-by-step through cases and behavioral questions, explaining fundamentals at your own pace—ideal for building and refining core skills.
          </p>
        </div>

        <div className="card-neubrutalist">
          <div className="icon-neubrutalist">
            <Puzzle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-black">Life-like Mock Case Interviews</h3>
          <p className="text-lg text-black opacity-80 leading-relaxed mb-2">
            <span className="badge badge-beta">Beta</span>
          </p>
          <p className="text-base text-black opacity-80 italic">
            Experience realistic MBB-inspired case studies, just like in actual interviews. Choose from multiple difficulty levels, with video and voice support. Our library refreshes regularly with fresh materials for ongoing relevance.
          </p>
        </div>

        <div className="card-neubrutalist">
          <div className="icon-neubrutalist">
            <Mic className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-black">Personalized Mock Behavioral Interviews</h3>
          <p className="text-lg text-black opacity-80 leading-relaxed mb-2">
            <span className="badge badge-beta">Beta</span>
          </p>
          <p className="text-base text-black opacity-80 italic">
            Craft and refine your personal story to shine in fit questions. Get tailored practice that helps you articulate experiences effectively and ace behavioral rounds.
          </p>
        </div>

        <div className="card-neubrutalist">
          <div className="icon-neubrutalist">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-black">Actionable Feedback</h3>
          <p className="text-lg text-black opacity-80 leading-relaxed mb-2">
            <span className="badge badge-beta">Beta</span>
          </p>
          <p className="text-base text-black opacity-80 italic">
            Receive professional-level assessments with targeted insights to improve. Spot habits like filler words or low energy, track progress over time, and get tips to avoid common pitfalls.
          </p>
        </div>

        <div className="card-neubrutalist">
          <div className="icon-neubrutalist">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-black">Personalized Learning Plan</h3>
          <p className="text-lg text-black opacity-80 leading-relaxed mb-2">
            <span className="badge badge-soon">Coming Soon</span>
          </p>
          <p className="text-base text-black opacity-80 italic">
            Build a custom roadmap based on your deadlines and skill level—complete with schedules, goals, and integrated training resources.
          </p>
        </div>

        <div className="card-neubrutalist">
          <div className="icon-neubrutalist">
            <Book className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-black">Training Materials</h3>
          <p className="text-lg text-black opacity-80 leading-relaxed mb-2">
            <span className="badge badge-soon">Coming Soon</span>
          </p>
          <p className="text-base text-black opacity-80 italic">
            Access up-to-date frameworks, drills, exercises, and guides to master case strategies and techniques.
          </p>
        </div>
      </div>

      <div className="text-center mb-8">
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
