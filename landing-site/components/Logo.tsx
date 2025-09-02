import Image from 'next/image'
import blackLogo from '../../BRANDING/LOGO/[SF] LOGO BLACK.png'

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export default function Logo({ width = 160, height = 40, className = "" }: LogoProps) {
  return (
    <Image
      src={blackLogo}
      alt="Logo"
      width={width}
      height={height}
      className={className}
      priority
    />
  )
}
