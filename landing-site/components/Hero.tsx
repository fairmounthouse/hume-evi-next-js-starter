'use client'

export default function Hero() {
  return (
    <section className="relative">
      {/* Floating decorative elements */}
      <div className="float-shape shape-yellow absolute top-[10%] left-[-100px]"></div>
      <div className="float-shape shape-blue absolute bottom-[20%] right-[-75px]"></div>
      
      <div className="pt-40 pb-20 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative">
        <div className="z-10">
          <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-4 py-2 rounded-full mb-8 font-semibold animate-[slideDown_0.6s_ease-out]">
            <div className="pulse-dot"></div>
            <span>AI-Powered Interview Prep</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black leading-[0.95] mb-8 tracking-tight animate-[slideUp_0.8s_ease-out]">
            Practice Interviews.<br/>
            <span className="text-gradient-blue">Get Hired.</span><br/>
            That Simple.
          </h1>
          
          <p className="text-xl lg:text-2xl text-black opacity-80 mb-12 leading-relaxed animate-[slideUp_0.9s_ease-out]">
            AI mock interviews that actually prepare you for the real thing. 
            No fluff, just results that land you the job.
          </p>

          <p className="text-lg font-semibold mb-8 animate-[slideUp_0.95s_ease-out]">
            The only AI that actually talks. 90% cheaper. 3x more effective.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 animate-[slideUp_1s_ease-out]">
            <button className="btn-neubrutalist btn-primary text-lg px-8 py-4">
              Start Real Practice →
            </button>
            <button className="btn-neubrutalist bg-white text-black border-[3px] border-black shadow-[5px_5px_0_#DBEAFE] hover:shadow-[8px_8px_0_#3B82F6] hover:bg-gray-100 hover:-translate-x-[3px] hover:-translate-y-[3px] text-lg px-8 py-4 transition-all duration-300">
              <svg width="20" height="20" viewBox="0 0 24 24" className="mr-2">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
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
