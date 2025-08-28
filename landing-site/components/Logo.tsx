interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export default function Logo({ width = 40, height = 80, className = "" }: LogoProps) {
  return (
    <svg 
      width={width} 
      height={height} 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 100 200"
    >
      <circle cx="50" cy="50" r="30" fill="#FFE234"/>
      <circle cx="50" cy="130" r="30" fill="#FFE234"/>
    </svg>
  )
}
