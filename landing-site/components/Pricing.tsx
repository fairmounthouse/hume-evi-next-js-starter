'use client'

import { useState } from 'react'

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(1) // Default to Quarterly (index 1)
  const plans = [
    {
      name: "Monthly",
      regular: "$50/mo",
      promo: "$37.50/mo",
      description: "120 mins (~4 sessions)",
      subtitle: "For casual preppers",
      isPopular: false
    },
    {
      name: "Quarterly", 
      regular: "$40/mo ($120)",
      promo: "$30/mo ($90)",
      description: "120 mins/mo (~4 sessions)",
      subtitle: "For seasonal users (3-mo. min.)",
      isPopular: true
    },
    {
      name: "Semi-Annually",
      regular: "$30/mo ($180)", 
      promo: "$22.50/mo ($135)",
      description: "120 mins/mo (~4 sessions)",
      subtitle: "For long-term builders (6-mo. min.)",
      isPopular: false
    }
  ]

  return (
    <section id="pricing" className="section-padding w-full overflow-x-hidden" style={{backgroundColor: '#FFF9E6'}}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black mb-6 md:mb-8 tracking-tight font-poppins">Straightforward Pricing</h2>
        <p className="text-lg sm:text-xl font-semibold text-black mb-4">
          Not sure? Try one mock interview and coaching session now!
        </p>
        <p className="text-base sm:text-lg text-black opacity-80">
          All plans include access to tools & modules (coming soon). Sessions avg. 20-30 mins.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 items-stretch">
        {plans.map((plan, index) => (
          <div 
            key={index} 
            className={`card bg-white border-[3px] rounded-[20px] p-8 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:translate-y-[-8px] hover:rotate-[-1deg] hover:shadow-[6px_6px_0_#000] relative flex flex-col h-full overflow-hidden cursor-pointer
              ${selectedPlan === index ? 'border-yellow-primary ring-4 ring-yellow-primary bg-yellow-light' : 'border-black'}
            `}
            onClick={() => setSelectedPlan(index)}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16">
                <div className="absolute transform rotate-45 bg-yellow-primary text-center text-black font-bold py-1 text-xs sm:text-sm right-[-25px] sm:right-[-35px] top-[22px] sm:top-[32px] w-[120px] sm:w-[170px] border border-black">
                  Most Popular
                </div>
              </div>
            )}
            <h3 className={`text-2xl font-bold mb-4 text-black leading-tight min-h-[2.5rem]`}>{plan.name}</h3>
            <div className="mb-4 min-h-[4.5rem]">
              <p className="text-sm text-gray-600 line-through">Reg: {plan.regular}</p>
              <p className="text-3xl font-black text-blue-accent">Promo: {plan.promo}</p>
            </div>
            <div className="mb-6 min-h-[4.5rem]">
              <p className="text-lg text-black mb-2">{plan.description}</p>
              <p className="text-base text-black opacity-80">{plan.subtitle}</p>
            </div>
            <button 
              className={`btn px-6 py-3 rounded-full font-bold text-base cursor-pointer transition-all duration-200 border-[3px] border-black inline-flex items-center gap-2 shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] mt-auto w-full justify-center
                ${selectedPlan === index ? 'bg-black text-white hover:bg-gray-800' : 'bg-yellow-primary text-black hover:bg-yellow-bright'}
              `}
              onClick={(e) => {
                e.stopPropagation()
                if (selectedPlan === index) {
                  window.open('https://app.skillflo.ai', '_blank')
                } else {
                  setSelectedPlan(index)
                }
              }}
            >
              {selectedPlan === index ? 'Get Started' : 'Select'}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mb-8">
        <p className="text-base sm:text-lg text-black mb-6">
          <strong>Top up:</strong> $20/60 mins or $200/700 mins.
        </p>
        <button 
          className="btn-neubrutalist btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
          onClick={() => window.open('https://app.skillflo.ai', '_blank')}
        >
          Start Free - Get Your Session
        </button>
      </div>
      </div>
    </section>
  )
}
