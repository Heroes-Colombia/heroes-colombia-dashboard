import Image from 'next/image'
import { getCategoryById, getCategoryIcon, getCategoryName } from '@/lib/constants/categories'
import { cn } from '@/lib/utils'

interface CategoryIconProps {
  categoryId: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showLabel?: boolean
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
}

const sizePx = {
  sm: 24,
  md: 40,
  lg: 64,
  xl: 96,
}

export function CategoryIcon({
  categoryId,
  size = 'md',
  className,
  showLabel = false,
}: CategoryIconProps) {
  const category = getCategoryById(categoryId)
  const iconPath = getCategoryIcon(categoryId)
  const name = getCategoryName(categoryId)

  if (!category) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-muted',
          sizeClasses[size],
          className
        )}
      >
        <span className="text-xs text-muted-foreground">?</span>
      </div>
    )
  }

  if (showLabel) {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className="relative rounded-lg overflow-hidden">
          <Image
            src={iconPath}
            alt={name}
            width={sizePx[size]}
            height={sizePx[size]}
            className={cn('object-contain', sizeClasses[size])}
          />
        </div>
        <span className="text-xs font-medium text-center max-w-[80px] line-clamp-2">
          {name}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('relative rounded-lg overflow-hidden', sizeClasses[size], className)}>
      <Image
        src={iconPath}
        alt={name}
        width={sizePx[size]}
        height={sizePx[size]}
        className={cn('object-contain', sizeClasses[size])}
        title={name}
      />
    </div>
  )
}
