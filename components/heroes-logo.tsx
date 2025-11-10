import Image from "next/image"

interface HeroesLogoProps {
  className?: string
  variant?: "sidebar" | "header" | "auth"
}

export function HeroesLogo({ className = "", variant = "sidebar" }: HeroesLogoProps) {
  // Responsive sizing based on context
  const sizeClasses = {
    sidebar: "h-8 w-auto sm:h-10", // Compact for sidebars (32px mobile, 40px desktop)
    header: "h-10 w-auto sm:h-12", // Medium for page headers (40px mobile, 48px desktop)
    auth: "h-12 w-auto sm:h-16 md:h-20", // Larger for auth pages (48px mobile, 64px tablet, 80px desktop)
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/images/Logotipo - 01.PNG"
        alt="Héroes Colombia"
        width={400}
        height={80}
        className={`${sizeClasses[variant]} object-contain`}
        priority={variant === "auth"}
        quality={90}
      />
    </div>
  )
}
