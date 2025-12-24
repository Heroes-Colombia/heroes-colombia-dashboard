"use client"

import { useState, useCallback, useRef } from "react"
import { ImageUpload } from "@/components/ui/image-upload"
import { ImageCropDialog } from "@/components/ui/image-crop-dialog"

interface ImageUploadWithCropProps {
  value?: string // Current image URL
  onChange: (file: File | null) => void
  onRemove?: () => void
  disabled?: boolean
  className?: string
  acceptedFormats?: string[]
  maxSizeMB?: number
  recommendedDimensions?: string
  aspectRatio?: number // Default 2/1
  minCroppedWidth?: number
  minCroppedHeight?: number
}

export function ImageUploadWithCrop({
  value,
  onChange,
  onRemove,
  disabled = false,
  className,
  acceptedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  maxSizeMB = 5,
  recommendedDimensions = "1600x800px (2:1)",
  aspectRatio = 2 / 1,
  minCroppedWidth = 800,
  minCroppedHeight = 400,
}: ImageUploadWithCropProps) {
  // Crop dialog state
  const [cropDialog, setCropDialog] = useState<{
    open: boolean
    imageSrc: string | null
    fileName: string | null
  }>({
    open: false,
    imageSrc: null,
    fileName: null,
  })

  // Preview state for cropped image
  const [croppedImagePreview, setCroppedImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handler to open crop dialog
  const handleOpenCropDialog = useCallback((imageSrc: string, fileName: string) => {
    setCropDialog({
      open: true,
      imageSrc,
      fileName,
    })
  }, [])

  // Handler for crop completion
  const handleCropComplete = useCallback((croppedFile: File) => {
    setSelectedFile(croppedFile)

    // Create preview URL for the cropped image
    const reader = new FileReader()
    reader.onloadend = () => {
      setCroppedImagePreview(reader.result as string)
    }
    reader.onerror = () => {
      console.error('FileReader error:', reader.error)
    }
    reader.readAsDataURL(croppedFile)

    // Close dialog
    setCropDialog({
      open: false,
      imageSrc: null,
      fileName: null,
    })

    // Notify parent
    onChange(croppedFile)
  }, [onChange])

  // Handler for crop cancellation
  const handleCropCancel = useCallback(() => {
    // Close dialog
    setCropDialog({
      open: false,
      imageSrc: null,
      fileName: null,
    })

    // Reset file input to allow re-selection of same file
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    // Don't change the preview - keep the existing image if there was one
  }, [])

  // Handler for image removal
  const handleRemove = useCallback(() => {
    setCroppedImagePreview(null)
    setSelectedFile(null)
    onChange(null)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    onRemove?.()
  }, [onChange, onRemove])

  // Handler when file is selected (not used directly, passed to ImageUpload)
  const handleFileChange = useCallback((file: File | null) => {
    // This is handled by the crop dialog, so we don't need to do anything here
    // The onChange will be called after crop completion
  }, [])

  return (
    <>
      <ImageUpload
        ref={fileInputRef}
        value={croppedImagePreview || value}
        onChange={handleFileChange}
        onOpenCropDialog={handleOpenCropDialog}
        onRemove={handleRemove}
        disabled={disabled}
        className={className}
        acceptedFormats={acceptedFormats}
        maxSizeMB={maxSizeMB}
        recommendedDimensions={recommendedDimensions}
        enableCrop={true}
        isCropping={cropDialog.open}
      />

      {cropDialog.imageSrc && (
        <ImageCropDialog
          open={cropDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              handleCropCancel()
            }
          }}
          imageSrc={cropDialog.imageSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={aspectRatio}
          fileName={cropDialog.fileName || "cropped-image.jpg"}
          minCroppedWidth={minCroppedWidth}
          minCroppedHeight={minCroppedHeight}
        />
      )}
    </>
  )
}
