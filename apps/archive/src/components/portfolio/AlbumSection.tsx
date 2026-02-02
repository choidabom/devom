"use client"

import { useState } from "react"
import "@/styles/album-section.css"

interface Photo {
  id: string
  url: string
  caption: string
  date: string
}

export const AlbumSection = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  const photos: Photo[] = [
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
      caption: "Mountain landscape",
      date: "Jan 2026",
    },
    {
      id: "2",
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop",
      caption: "Forest path",
      date: "Dec 2025",
    },
    {
      id: "3",
      url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop",
      caption: "Ocean view",
      date: "Nov 2025",
    },
    {
      id: "4",
      url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop",
      caption: "City lights",
      date: "Oct 2025",
    },
    {
      id: "5",
      url: "https://images.unsplash.com/photo-1511576661531-b34d7da5d0bb?w=800&h=600&fit=crop",
      caption: "Desert sunset",
      date: "Sep 2025",
    },
    {
      id: "6",
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop",
      caption: "Northern lights",
      date: "Aug 2025",
    },
  ]

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo)
  }

  const handleCloseModal = () => {
    setSelectedPhoto(null)
  }

  return (
    <div className="album-section">
      <h2 className="section-title">Album</h2>

      <div className="album-grid">
        {photos.map((photo) => (
          <div key={photo.id} className="album-photo-wrapper" onClick={() => handlePhotoClick(photo)}>
            <div className="album-photo">
              <img src={photo.url} alt={photo.caption} className="album-photo-image" draggable="false" />
              <div className="album-photo-overlay">
                <span className="album-photo-caption">{photo.caption}</span>
                <span className="album-photo-date">{photo.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="album-modal" onClick={handleCloseModal}>
          <div className="album-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="album-modal-close" onClick={handleCloseModal}>
              ✕
            </button>
            <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="album-modal-image" />
            <div className="album-modal-info">
              <span className="album-modal-caption">{selectedPhoto.caption}</span>
              <span className="album-modal-date">{selectedPhoto.date}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
