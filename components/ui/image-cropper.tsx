'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ImageCropperProps {
  image: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
  aspectRatio?: number
  cropShape?: 'rect' | 'round'
  open?: boolean
}

export function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  cropShape = 'round',
  open = true,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop)
  }, [])

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom)
  }, [])

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.src = url
    })

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    // Set canvas size to match crop area
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    // Optimize image size: Scale down to max 512x512px for profile photos
    const MAX_SIZE = 512
    let finalCanvas = canvas

    if (pixelCrop.width > MAX_SIZE || pixelCrop.height > MAX_SIZE) {
      const scale = MAX_SIZE / Math.max(pixelCrop.width, pixelCrop.height)
      const newWidth = Math.round(pixelCrop.width * scale)
      const newHeight = Math.round(pixelCrop.height * scale)

      const optimizedCanvas = document.createElement('canvas')
      optimizedCanvas.width = newWidth
      optimizedCanvas.height = newHeight
      const optimizedCtx = optimizedCanvas.getContext('2d')

      if (!optimizedCtx) {
        throw new Error('No 2d context for optimization')
      }

      optimizedCtx.imageSmoothingEnabled = true
      optimizedCtx.imageSmoothingQuality = 'high'
      optimizedCtx.drawImage(canvas, 0, 0, newWidth, newHeight)

      finalCanvas = optimizedCanvas
    }

    return new Promise((resolve, reject) => {
      finalCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        0.85
      )
    })
  }

  const handleSave = async () => {
    if (!croppedAreaPixels) return

    setIsSaving(true)
    try {
      const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels)
      onCropComplete(croppedImageBlob)
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 1))
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Bild zuschneiden</DialogTitle>
          <DialogDescription>
            Verschiebe und zoome das Bild, um den gewünschten Ausschnitt zu wählen.
          </DialogDescription>
        </DialogHeader>

        {/* Crop Area */}
        <div className="relative h-[350px] w-full rounded-lg overflow-hidden bg-muted">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={cropShape}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
                borderRadius: '0.5rem',
              },
            }}
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            aria-label="Verkleinern"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={([value]) => setZoom(value)}
              aria-label="Zoom"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            aria-label="Vergrössern"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-right">
            {zoom.toFixed(1)}x
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Speichere...' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
