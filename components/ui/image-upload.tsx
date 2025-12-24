"use client"

import { useState, useCallback, useRef, useEffect, forwardRef } from "react"
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, CheckCircle, Crop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { softValidatePromotionImage, autoFitToAspectRatio, PROMOTION_IMAGE_REQUIREMENTS } from "@/lib/utils/image-validation"

interface ImageUploadProps {
  value?: string // Current image URL
  onChange: (file: File | null) => void
  onOpenCropDialog?: (imageSrc: string, fileName: string) => void // NEW: Callback to open crop dialog
  onRemove?: () => void
  disabled?: boolean
  className?: string
  acceptedFormats?: string[] // e.g., ["image/jpeg", "image/png", "image/webp"]
  maxSizeMB?: number
  recommendedDimensions?: string // e.g., "1200x630px"
  enableAutoCorrection?: boolean // Auto-fit images to 2:1 aspect ratio
  enableCrop?: boolean // Enable crop and pan functionality
  cropAspectRatio?: number // Aspect ratio for crop (default: 2/1) - DEPRECATED when using onOpenCropDialog
  isCropping?: boolean // Indicates if crop dialog is currently open
}

export const ImageUpload = forwardRef<HTMLInputElement, ImageUploadProps>(({
  value,
  onChange,
  onOpenCropDialog,
  onRemove,
  disabled = false,
  className,
  acceptedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  maxSizeMB = 5,
  recommendedDimensions,
  enableAutoCorrection = false,
  enableCrop = false,
  cropAspectRatio = 2 / 1,
  isCropping = false,
}, ref) => {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync preview with value prop when it changes
  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Formato no válido. Usa: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      return `El archivo es muy grande. Máximo ${maxSizeMB}MB`
    }

    return null
  }

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      setWarnings([])

      // Basic validation
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      // If crop is enabled, delegate to parent via callback
      if (enableCrop && onOpenCropDialog) {
        const reader = new FileReader()
        reader.onloadend = () => {
          onOpenCropDialog(reader.result as string, file.name)
        }
        reader.onerror = () => {
          setError('No se pudo leer el archivo. Intenta con otra imagen.')
          console.error('FileReader error:', reader.error)
        }
        reader.readAsDataURL(file)
        return
      }

      // Auto-correction for promotions (legacy behavior when crop is disabled)
      if (enableAutoCorrection) {
        setIsProcessing(true)
        try {
          // Validate and get suggestions
          const validation = await softValidatePromotionImage(file)

          if (validation.suggestions.length > 0) {
            setWarnings(validation.suggestions)
          }

          let processedFile: File = file

          // Auto-fit to 2:1 aspect ratio if needed
          if (validation.needsProcessing) {
            const blob = await autoFitToAspectRatio(
              file,
              PROMOTION_IMAGE_REQUIREMENTS.dimensions.recommended.width,
              PROMOTION_IMAGE_REQUIREMENTS.dimensions.recommended.height,
              PROMOTION_IMAGE_REQUIREMENTS.quality.jpeg
            )

            // Convert blob to file
            processedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
          }

          // Create preview
          const reader = new FileReader()
          reader.onloadend = () => {
            setPreview(reader.result as string)
          }
          reader.readAsDataURL(processedFile)

          // Pass processed file to parent
          onChange(processedFile)
        } catch (error) {
          console.error('Error processing image:', error)
          setError('No se pudo procesar la imagen. Intenta con otra.')
        } finally {
          setIsProcessing(false)
        }
      } else {
        // No auto-correction: just create preview and pass file
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        onChange(file)
      }
    },
    [onChange, onOpenCropDialog, acceptedFormats, maxSizeMB, enableAutoCorrection, enableCrop]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile, disabled]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleRemove = useCallback(() => {
    setPreview(null)
    setError(null)
    setWarnings([])
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onRemove?.()
  }, [onChange, onRemove])

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  return (
    <>

      <div className={cn("space-y-3", className)}>
        {/* Preview or Drop Zone */}
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed transition-colors",
            isDragging && !disabled && "border-primary bg-primary/5",
            !isDragging && "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "cursor-pointer",
            preview ? "aspect-video" : "aspect-video"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
        {preview ? (
          // Image Preview
          <>
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover rounded-lg"
            />
            {/* Cropping overlay */}
            {isCropping && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Crop className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-medium">Ajustando imagen...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recorta y posiciona tu imagen
                  </p>
                </div>
              </div>
            )}
            {!disabled && !isCropping && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick()
                  }}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Cambiar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            )}
          </>
        ) : (
          // Drop Zone
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            {isProcessing ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium mb-1">Procesando imagen...</p>
                <p className="text-xs text-muted-foreground">
                  Ajustando a proporción 2:1
                </p>
              </>
            ) : (
              <>
                <div className={cn(
                  "rounded-full p-4 mb-4",
                  isDragging ? "bg-primary/10" : "bg-muted"
                )}>
                  <ImageIcon className={cn(
                    "h-8 w-8",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <p className="text-sm font-medium mb-1">
                  {isDragging ? "Suelta la imagen aquí" : "Arrastra una imagen o haz clic para seleccionar"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} • Máximo {maxSizeMB}MB
                </p>
                {enableAutoCorrection && (
                  <p className="text-xs text-primary mt-2 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Se ajustará automáticamente a 2:1
                  </p>
                )}
                {enableCrop && !enableAutoCorrection && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center justify-center gap-1">
                    <Crop className="h-3 w-3" />
                    Podrás ajustar la imagen a proporción 2:1
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Recommended Dimensions */}
      {recommendedDimensions && !error && warnings.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Dimensiones recomendadas: {recommendedDimensions}
        </p>
      )}

      {/* Warning Messages */}
      {warnings.length > 0 && !error && (
        <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <p key={index} className="text-xs text-blue-700 dark:text-blue-300">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}
      </div>
    </>
  )
})

ImageUpload.displayName = "ImageUpload"
