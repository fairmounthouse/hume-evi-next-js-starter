import fs from 'fs'
import path from 'path'

function getSchoolLogos(): string[] {
  const schoolsDir = path.join(process.cwd(), 'public', 'Logo_wall', 'schools')
  try {
    const files = fs.readdirSync(schoolsDir)
    const allowed = new Set(['.png', '.jpg', '.jpeg', '.svg', '.webp'])
    return files
      .filter((file) => !file.startsWith('.') && allowed.has(path.extname(file).toLowerCase()))
      .sort()
      .map((file) => `/Logo_wall/schools/${file}`)
  } catch (_) {
    return []
  }
}

export default function Stats() {
  const logos = getSchoolLogos()
  return (
    <section className="py-16" style={{backgroundColor: '#ffffff'}}>
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-4 bg-green-light border-3 border-black rounded-2xl transition-all duration-300 hover:translate-y-[-5px] hover:rotate-[-2deg] hover:shadow-[5px_5px_0_#000] hover:bg-yellow-primary">
            <span className="text-5xl font-black text-black block">50K+</span>
            <span className="text-base font-semibold text-black mt-2">Mock Interviews</span>
          </div>
          <div className="text-center p-4 bg-green-light border-3 border-black rounded-2xl transition-all duration-300 hover:translate-y-[-5px] hover:rotate-[-2deg] hover:shadow-[5px_5px_0_#000] hover:bg-yellow-primary">
            <span className="text-5xl font-black text-black block">92%</span>
            <span className="text-base font-semibold text-black mt-2">Success Rate</span>
          </div>
          <div className="text-center p-4 bg-green-light border-3 border-black rounded-2xl transition-all duration-300 hover:translate-y-[-5px] hover:rotate-[-2deg] hover:shadow-[5px_5px_0_#000] hover:bg-yellow-primary">
            <span className="text-5xl font-black text-black block">500+</span>
            <span className="text-base font-semibold text-black mt-2">Companies</span>
          </div>
          <div className="text-center p-4 bg-green-light border-3 border-black rounded-2xl transition-all duration-300 hover:translate-y-[-5px] hover:rotate-[-2deg] hover:shadow-[5px_5px_0_#000] hover:bg-yellow-primary">
            <span className="text-5xl font-black text-black block">24/7</span>
            <span className="text-base font-semibold text-black mt-2">Available</span>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-center text-base md:text-lg font-semibold tracking-wide text-black mb-6">
            Trusted by students from
          </h3>

          <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-12 [&_img]:max-w-none animate-infinite-scroll">
              {logos.map((src) => {
                const alt = src.split('/').pop()?.replace(/\.[^.]+$/, '') || 'School logo'
                return (
                  <li key={src}>
                    <img src={src} alt={alt} className="h-14 md:h-16 lg:h-20 w-auto" />
                  </li>
                )
              })}
            </ul>
            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-12 [&_img]:max-w-none animate-infinite-scroll" aria-hidden="true">
              {logos.map((src) => {
                const alt = src.split('/').pop()?.replace(/\.[^.]+$/, '') || 'School logo'
                return (
                  <li key={`dup-${src}`}>
                    <img src={src} alt={alt} className="h-14 md:h-16 lg:h-20 w-auto" />
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
