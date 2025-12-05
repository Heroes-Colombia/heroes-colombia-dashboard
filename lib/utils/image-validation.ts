/**
 * Image Validation Utilities for Promotion Images
 * Heroes Colombia Dashboard
 *
 * Enforces image requirements for optimal display in mobile app
 */

export const PROMOTION_IMAGE_REQUIREMENTS = {
  aspectRatio: {
    width: 2,
    height: 1,
    tolerance: 0.15, // 15% tolerance for minor variations
  },
  dimensions: {
    minWidth: 800,
    minHeight: 400,
    recommended: {
      width: 1600,
      height: 800,
    },
  },
  fileSize: {
    maxBytes: 2 * 1024 * 1024, // 2MB
    recommendedBytes: 500 * 1024, // 500KB
  },
  formats: ['image/jpeg', 'image/png', 'image/webp'],
  quality: {
    jpeg: 0.85,
    webp: 0.85,
  },
};

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    width: number;
    height: number;
    aspectRatio: number;
    fileSize: number;
    format: string;
  };
}

/**
 * Validates an image file for promotion upload
 */
export async function validatePromotionImage(
  file: File
): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check file format
  if (!PROMOTION_IMAGE_REQUIREMENTS.formats.includes(file.type)) {
    errors.push(
      `Formato no válido. Use JPG, PNG o WebP`
    );
  }

  // 2. Check file size
  if (file.size > PROMOTION_IMAGE_REQUIREMENTS.fileSize.maxBytes) {
    errors.push(
      `Archivo muy grande (${formatFileSize(file.size)}). Máximo: 2MB`
    );
  }

  if (
    file.size > PROMOTION_IMAGE_REQUIREMENTS.fileSize.recommendedBytes &&
    file.size <= PROMOTION_IMAGE_REQUIREMENTS.fileSize.maxBytes
  ) {
    warnings.push(
      `Archivo grande (${formatFileSize(file.size)}). Recomendado: 500KB para carga rápida`
    );
  }

  // 3. Load image and check dimensions
  try {
    const metadata = await getImageMetadata(file);

    if (
      metadata.width < PROMOTION_IMAGE_REQUIREMENTS.dimensions.minWidth ||
      metadata.height < PROMOTION_IMAGE_REQUIREMENTS.dimensions.minHeight
    ) {
      errors.push(
        `Dimensiones muy pequeñas (${metadata.width}x${metadata.height}). Mínimo: 800x400px`
      );
    }

    // 4. Check aspect ratio
    const targetRatio =
      PROMOTION_IMAGE_REQUIREMENTS.aspectRatio.width /
      PROMOTION_IMAGE_REQUIREMENTS.aspectRatio.height;
    const tolerance = PROMOTION_IMAGE_REQUIREMENTS.aspectRatio.tolerance;
    const actualRatio = metadata.aspectRatio;

    if (Math.abs(actualRatio - targetRatio) > targetRatio * tolerance) {
      errors.push(
        `Proporción incorrecta. Debe ser 2:1 (horizontal). Actual: ${actualRatio.toFixed(2)}:1`
      );
    }

    // 5. Check if dimensions are optimal
    if (
      metadata.width < PROMOTION_IMAGE_REQUIREMENTS.dimensions.recommended.width ||
      metadata.height < PROMOTION_IMAGE_REQUIREMENTS.dimensions.recommended.height
    ) {
      warnings.push(
        `Para mejor calidad, use 1600x800px o superior`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['No se pudo cargar la imagen. Verifique el archivo.'],
      warnings: [],
    };
  }
}

/**
 * Gets image metadata from file
 */
async function getImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  aspectRatio: number;
  fileSize: number;
  format: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        fileSize: file.size,
        format: file.type,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen'));
    };

    img.src = url;
  });
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compresses image to meet requirements
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1600,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('No se pudo comprimir la imagen'));
          }
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen'));
    };

    img.src = url;
  });
}

/**
 * Smart auto-fit: Automatically crops/fits any image to 2:1 aspect ratio
 * Uses intelligent positioning to preserve the most important part of the image
 */
export async function autoFitToAspectRatio(
  file: File,
  targetWidth: number = 1600,
  targetHeight: number = 800,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const targetRatio = targetWidth / targetHeight; // 2:1
      const sourceRatio = img.width / img.height;

      // Create canvas with target dimensions
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'));
        return;
      }

      // Fill background with white (in case of transparency)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
      let dx = 0, dy = 0, dWidth = targetWidth, dHeight = targetHeight;

      if (sourceRatio > targetRatio) {
        // Source is wider - crop sides (preserve center)
        sWidth = img.height * targetRatio;
        sx = (img.width - sWidth) / 2; // Center horizontally
      } else if (sourceRatio < targetRatio) {
        // Source is taller - crop top/bottom (preserve center-top)
        sHeight = img.width / targetRatio;
        sy = 0; // Keep top (usually more important for promotional images)
      }

      // Draw the cropped/fitted image
      ctx.drawImage(
        img,
        sx, sy, sWidth, sHeight,  // Source rectangle
        dx, dy, dWidth, dHeight   // Destination rectangle
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('No se pudo procesar la imagen'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen'));
    };

    img.src = url;
  });
}

/**
 * Soft validation: Checks image but doesn't block upload
 * Returns suggestions instead of errors
 */
export async function softValidatePromotionImage(
  file: File
): Promise<{
  needsProcessing: boolean;
  suggestions: string[];
  metadata?: {
    width: number;
    height: number;
    aspectRatio: number;
    fileSize: number;
    format: string;
  };
}> {
  const suggestions: string[] = [];

  // Check file format
  if (!PROMOTION_IMAGE_REQUIREMENTS.formats.includes(file.type)) {
    suggestions.push('Formato no ideal. JPG o WebP son recomendados para mejor rendimiento');
  }

  try {
    const metadata = await getImageMetadata(file);
    const targetRatio = 2.0;
    const actualRatio = metadata.aspectRatio;

    // Check if processing is needed
    const needsProcessing =
      Math.abs(actualRatio - targetRatio) > 0.1 ||
      file.size > 500 * 1024 ||
      metadata.width > 1600;

    if (Math.abs(actualRatio - targetRatio) > 0.1) {
      suggestions.push('La imagen será automáticamente ajustada a proporción 2:1');
    }

    if (file.size > 1024 * 1024) {
      suggestions.push('La imagen será comprimida para carga más rápida');
    }

    if (metadata.width < 800 || metadata.height < 400) {
      suggestions.push('⚠️ Imagen pequeña. Recomendamos 1600x800px para mejor calidad');
    }

    return {
      needsProcessing,
      suggestions,
      metadata,
    };
  } catch (error) {
    return {
      needsProcessing: true,
      suggestions: ['La imagen será procesada automáticamente'],
    };
  }
}
