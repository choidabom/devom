import { useCallback, useEffect, useState } from "react"

interface SelectedImage {
  url: string
  date: number
  month: number
}

/**
 * Calendar image preview modal hook
 *
 * Manages the state and behavior of the calendar image preview modal.
 * Prevents image click during drag operations and handles ESC key to close.
 *
 * @param hasMoved - Whether the user has dragged the calendar (prevents accidental clicks)
 * @returns {Object} Image preview state and handlers
 * - selectedImage: Currently selected image data or null
 * - handleImageClick: Click handler for calendar day images
 * - handleClosePreview: Handler to close the preview modal
 */
export const useCalendarImagePreview = (hasMoved: boolean) => {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)

  const handleImageClick = useCallback(
    (imageUrl: string, month: number, date: number) => {
      if (!hasMoved) {
        setSelectedImage({ url: imageUrl, date, month })
      }
    },
    [hasMoved]
  )

  const handleClosePreview = useCallback(() => setSelectedImage(null), [])

  useEffect(() => {
    if (!selectedImage) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClosePreview()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedImage, handleClosePreview])

  return {
    selectedImage,
    handleImageClick,
    handleClosePreview,
  }
}
