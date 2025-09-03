'use client'

export default function Hero() {
  return (
    <section className="relative w-full overflow-x-hidden">
      {/* Floating decorative elements */}
      <div className="float-shape shape-yellow absolute top-[10%] left-[-100px]"></div>
      <div className="float-shape shape-blue absolute bottom-[20%] right-[-75px]"></div>
      
      <div className="pt-32 md:pt-48 pb-16 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center relative w-full">
        <div className="z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[0.95] mb-6 md:mb-8 tracking-tight animate-[slideUp_0.8s_ease-out]">
            Case Coach.<br/>
            <span className="text-gradient-blue">Job Offers.</span><br/>
            That Simple.
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-black opacity-80 mb-8 md:mb-12 leading-relaxed animate-[slideUp_0.9s_ease-out]">
          Cutting-edge voice and video AI interview coaching that gets you hired. No fluff, just results.
          </p>

          <div className="relative mb-6 md:mb-8 animate-[slideUp_0.95s_ease-out]">
            <p className="text-base sm:text-2xl font-semibold">
              3x the results. 10% of the cost. Available 24/7.
            </p>
            <img 
              src="/yellow-underline.png" 
              alt="" 
              className="absolute -bottom-2 left-0 w-[90%] h-[8px] sm:h-[12px] object-cover object-left"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 animate-[slideUp_1s_ease-out]">
            <button 
              className="btn-neubrutalist btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
              onClick={() => window.open('https://app.skillflo.ai', '_blank')}
            >
              Start Real Practice →
            </button>
          </div>
        </div>
        
        <div className="relative animate-[fadeIn_1.2s_ease-out]">
          <div className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:translate-y-[-5px] transition-all duration-300">
            <div className="bg-gray-50 border-b border-gray-300 px-6 py-6 flex items-center justify-between">
              <div className="text-lg font-semibold text-black">AI Interview Session</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 font-medium">Recording</span>
              </div>
            </div>
            <div className="p-8 bg-white min-h-[350px]">
              <div className="bg-gray-100 border border-gray-300 rounded-xl p-6 mb-4 font-medium relative animate-[slideIn_0.5s_ease-out] text-black">
                Tell me about a time you overcame a significant challenge at work.
              </div>
              <div className="bg-blue-light border border-blue-300 rounded-xl p-6 ml-12 mb-4 font-medium animate-[slideIn_0.7s_ease-out] text-black">
                Last year, our team faced a critical deadline when our lead developer left unexpectedly...
              </div>
              <div className="flex gap-2 p-4">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
