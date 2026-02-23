"use client"

import { MONTH_NAMES } from "@/constants/calendar"
import calendarImageMap from "@/data/calendar-manifest.json"
import "@/styles/calendar-page.css"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { memo, useCallback, useMemo, useState } from "react"

interface CalendarImage {
  month: number
  date: number
  imageUrl: string
  position: { x: number; y: number }
  rotation: number
  width: number
  height: number
}

/**
 * 이미지 파일명에서 날짜 코드(MMDD)를 파싱
 */
function parseImageDate(imagePath: string): { month: number; date: number } | null {
  const filename = imagePath.split("/").pop()
  if (!filename) return null

  const dateCode = filename.replace(/\.(jpeg|jpg|png|webp|gif)$/i, "")
  const month = parseInt(dateCode.substring(0, 2), 10)
  const date = parseInt(dateCode.substring(2, 4), 10)

  if (isNaN(month) || isNaN(date)) return null
  return { month, date }
}

/**
 * 이미지들을 자유롭게 배치하기 위한 미리 정의된 위치 배열
 * 각 이미지의 실제 비율을 반영
 */
const SCATTERED_POSITIONS = [
  { x: 8, y: 5, rotation: 2, width: 200, height: 242 }, // 0102.jpg (580x704)
  { x: 28, y: 3, rotation: -3, width: 200, height: 147 }, // 0105.jpeg (941x692)
  { x: 50, y: 8, rotation: 2, width: 200, height: 200 }, // 0112.jpeg (941x941)
  { x: 72, y: 5, rotation: -1, width: 200, height: 131 }, // 0120.jpeg (941x615)
  { x: 5, y: 28, rotation: 4, width: 200, height: 267 }, // 0201.jpeg (941x1255)
  { x: 30, y: 30, rotation: -2, width: 200, height: 150 }, // 0305.jpeg (941x706)
  { x: 55, y: 32, rotation: 1, width: 200, height: 159 }, // 0402.jpeg (941x748)
  { x: 78, y: 28, rotation: 3, width: 200, height: 120 }, // 0430.jpeg (941x565)
  { x: 10, y: 52, rotation: -4, width: 220, height: 133 }, // 0501.jpeg (1792x1079)
  { x: 38, y: 55, rotation: 2, width: 200, height: 134 }, // 0525.jpeg (941x631)
  { x: 65, y: 53, rotation: -1, width: 200, height: 223 }, // 0530.jpeg (941x1048)
  { x: 8, y: 75, rotation: 3, width: 200, height: 130 }, // 0617.jpeg (941x609)
  { x: 33, y: 78, rotation: -2, width: 200, height: 159 }, // 0620.jpeg (941x748)
  { x: 58, y: 75, rotation: 1, width: 200, height: 150 }, // 0628.jpeg (941x706)
  { x: 12, y: 98, rotation: 4, width: 280, height: 73 }, // 0701.jpeg (944x246)
  { x: 48, y: 100, rotation: -3, width: 200, height: 200 }, // 0901.jpeg (941x941)
  { x: 38, y: 98, rotation: 2, width: 200, height: 181 }, // 0929.jpeg (941x851) - moved left
  { x: 83, y: 52, rotation: -1, width: 200, height: 111 }, // 1001.jpeg (941x525)
  { x: 85, y: 75, rotation: 2, width: 200, height: 193 }, // 1101.webp (900x867)
  { x: 15, y: 120, rotation: -2, width: 200, height: 112 }, // 1221.jpeg (1024x576) - moved left
]

interface CalendarImageCardProps {
  image: CalendarImage
  index: number
  formattedDate: string
  onDragStart: () => void
  onDragEnd: () => void
  onClick: (image: CalendarImage) => void
}

const CalendarImageCard = memo(({ image, index, formattedDate, onDragStart, onDragEnd, onClick }: CalendarImageCardProps) => {
  return (
    <motion.div
      className="calendar-page-item"
      drag
      dragMomentum={false}
      dragElastic={0}
      dragTransition={{ power: 0, timeConstant: 0 }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        width: `${image.width}px`,
        height: `${image.height}px`,
      }}
      initial={{
        opacity: 0,
        scale: 0.8,
        left: `${image.position.x}%`,
        top: `${image.position.y}%`,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => onClick(image)}
    >
      <img src={image.imageUrl} alt={formattedDate} className="calendar-page-image" style={{ transform: `rotate(${image.rotation}deg)` }} draggable={false} />
      <div className="calendar-page-date">{formattedDate}</div>
    </motion.div>
  )
})

export default function CalendarPage() {
  const [selectedImage, setSelectedImage] = useState<CalendarImage | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const year = new Date().getFullYear()

  const calendarImages = useMemo(() => {
    return Object.keys(calendarImageMap)
      .map((imagePath, index) => {
        const dateInfo = parseImageDate(imagePath)
        if (!dateInfo) return null

        const position = SCATTERED_POSITIONS[index % SCATTERED_POSITIONS.length]
        if (!position) return null

        return {
          month: dateInfo.month,
          date: dateInfo.date,
          imageUrl: calendarImageMap[imagePath as keyof typeof calendarImageMap],
          position: { x: position.x, y: position.y },
          rotation: position.rotation,
          width: position.width,
          height: position.height,
        }
      })
      .filter((img): img is CalendarImage => img !== null)
  }, [])

  const handleImageClick = useCallback(
    (image: CalendarImage) => {
      if (!isDragging) {
        setSelectedImage(image)
      }
    },
    [isDragging]
  )

  const handleClosePreview = useCallback(() => {
    setSelectedImage(null)
  }, [])

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback(() => {
    setTimeout(() => setIsDragging(false), 100)
  }, [])

  return (
    <div className="calendar-page">
      <Link href="/" className="calendar-page-back-link">
        ← Back to Archive
      </Link>

      <div className="calendar-page-container">
        {calendarImages.map((image, index) => {
          const formattedDate = `${MONTH_NAMES[image.month - 1]} ${image.date}`

          return (
            <CalendarImageCard
              key={index}
              image={image}
              index={index}
              formattedDate={formattedDate}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onClick={handleImageClick}
            />
          )
        })}
      </div>

      <div className="calendar-page-info">
        <h1 className="calendar-page-title">
          A year in moments<span className="calendar-page-year">, {year}</span>
        </h1>
        <p className="calendar-page-description">Even days that seem ordinary can be captured in a single moment and remembered.</p>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="calendar-page-preview-backdrop"
            onClick={handleClosePreview}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="calendar-page-preview-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <img src={selectedImage.imageUrl} alt={`${selectedImage.month}/${selectedImage.date}`} className="calendar-page-preview-image" />
              <div className="calendar-page-preview-date">
                {MONTH_NAMES[selectedImage.month - 1]} {selectedImage.date}, {year}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
