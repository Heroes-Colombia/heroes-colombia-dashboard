import { Shield } from "lucide-react"

interface HeroesLogoProps {
  className?: string
  showText?: boolean
}

export function HeroesLogo({ className = "", showText = true }: HeroesLogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Shield className="h-8 w-8 text-primary" />
      {showText && <span className="ml-2 text-xl font-bold text-foreground">Héroes Colombia</span>}
    </div>
  )
}
