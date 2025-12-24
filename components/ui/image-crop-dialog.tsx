"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, Loader2, AlertTriangle } from "lucide-react"
import { getCroppedImg, blobToFile, type Area } from "@/lib/utils/image-crop"
import { toast } from "sonner"

interface ImageCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedFile: File) => void
  aspectRatio?: number
  fileName?: string
  minCroppedWidth?: number
  minCroppedHeight?: number
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 2 / 1, // Default 2:1 for promotions
  fileName = "cropped-image.jpg",
  minCroppedWidth = 800,
  minCroppedHeight = 400,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location)
  }, [])

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom)
  }, [])

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)

      // Real-time validation feedback
      if (croppedAreaPixels.width < minCroppedWidth || croppedAreaPixels.height < minCroppedHeight) {
        setValidationError(
          `La imagen recortada debe ser al menos ${minCroppedWidth}x${minCroppedHeight}px. ` +
          `Actual: ${Math.round(croppedAreaPixels.width)}x${Math.round(croppedAreaPixels.height)}px`
        )
      } else {
        setValidationError(null)
      }
    },
    [minCroppedWidth, minCroppedHeight]
  )

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels) return

    // Final validation before cropping
    if (croppedAreaPixels.width < minCroppedWidth || croppedAreaPixels.height < minCroppedHeight) {
      toast.error('Imagen muy pequeña', {
        description: `La imagen recortada debe ser al menos ${minCroppedWidth}x${minCroppedHeight}px. Intenta hacer zoom para agrandar el área seleccionada.`
      })
      return
    }

    setIsProcessing(true)
    try {
      const croppedBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels
      )

      // Validate blob dimensions using Image API
      const img = new Image()
      const objectUrl = URL.createObjectURL(croppedBlob)

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = objectUrl
      })

      URL.revokeObjectURL(objectUrl)

      // Double-check actual dimensions
      if (img.width < minCroppedWidth || img.height < minCroppedHeight) {
        toast.error('Imagen muy pequeña', {
          description: `La imagen resultante (${img.width}x${img.height}px) es menor que el mínimo requerido (${minCroppedWidth}x${minCroppedHeight}px).`
        })
        setIsProcessing(false)
        return
      }

      const croppedFile = blobToFile(croppedBlob, fileName)
      onCropComplete(croppedFile)
      onOpenChange(false)
      handleCancel()
    } catch (error) {
      console.error('Error cropping image:', error)
      toast.error('Error al procesar la imagen', {
        description: 'No se pudo recortar la imagen. Por favor intenta nuevamente.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    // Reset state
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustar imagen</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Crop Area */}
          <div className="relative w-full h-[300px] bg-muted rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteCallback}
              objectFit="horizontal-cover"
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Zoom
                </Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                  min={1}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Validation Warning */}
          {validationError && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  {validationError}
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Instrucciones:</strong> Arrastra la imagen para posicionarla. Usa los controles para hacer zoom.
              El área seleccionada será la imagen final.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleApplyCrop} disabled={isProcessing || !!validationError}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Aplicar recorte"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
