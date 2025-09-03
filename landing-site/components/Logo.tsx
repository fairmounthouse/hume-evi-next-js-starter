import Image from 'next/image'
import multiColorLogo from '../../BRANDING/LOGO/[SF] LOGO MULTICOLOR.png'

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export default function Logo({ width = 192, height = 48, className = "" }: LogoProps) {
  return (
    <Image
      src={multiColorLogo}
      alt="Logo"
      width={width}
      height={height}
      className={className}
      priority
    />
  )
}
