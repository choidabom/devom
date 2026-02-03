"use client"

import { useCallback, useMemo } from "react"

import { generateYearDays, getTodayInfo, MAX_DATE, MAX_MONTH, MIN_DATE, MIN_MONTH, MONTH_NAMES } from "@/constants/calendar"
import calendarImageMap from "@/data/calendar-manifest.json"
import { useCalendarDrag } from "@/hooks/useCalendarDrag"
import { useCalendarImagePreview } from "@/hooks/useCalendarImagePreview"
import { useCalendarScroll } from "@/hooks/useCalendarScroll"
import type { CalendarDay } from "@/types/calendar"
import "@/styles/calendar.css"

interface DayInfo {
  month: number
  date: number
  monthName: string
}

/**
 * 이미지 파일명에서 날짜 코드(MMDD)를 파싱하여 CalendarDay 객체로 변환
 * 파일명 형식: MMDD.{jpeg,jpg,png,webp,gif} (예: 0105.jpeg = 1월 5일)
 */
function parseImageDayFromFilename(imagePath: string, imageUrl: string, year: number): CalendarDay | null {
  const filename = imagePath.split("/").pop()
  if (!filename) return null

  const dateCode = filename.replace(/\.(jpeg|jpg|png|webp|gif)$/i, "")

  const month = parseInt(dateCode.substring(0, 2), 10)
  const date = parseInt(dateCode.substring(2, 4), 10)

  const isMonthValid = !isNaN(month) && month >= MIN_MONTH && month <= MAX_MONTH
  const isDateValid = !isNaN(date) && date >= MIN_DATE && date <= MAX_DATE

  if (!isMonthValid || !isDateValid) return null

  return {
    date,
    month,
    year,
    imageUrl,
  }
}

export const Calendar = () => {
  const year = new Date().getFullYear()
  const today = useMemo(() => getTodayInfo(), [])
  const yearDays = useMemo(() => generateYearDays(year), [year])

  const { scrollContainerRef, dragState, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave } = useCalendarDrag()

  const { selectedImage, handleImageClick, handleClosePreview } = useCalendarImagePreview(dragState.hasMoved)

  useCalendarScroll(scrollContainerRef, year, today)

  /**
   * /public/calendar 폴더에서 이미지 파일을 자동으로 가져와 날짜별로 매핑
   * Next.js에서는 calendar-manifest.json을 사용하여 이미지 경로를 관리
   */
  const imageDays = useMemo(() => {
    return Object.keys(calendarImageMap)
      .map((imagePath) => parseImageDayFromFilename(imagePath, calendarImageMap[imagePath as keyof typeof calendarImageMap], year))
      .filter((day): day is CalendarDay => day !== null)
  }, [year])

  /**
   * 특정 월/일의 이미지 정보를 찾는 함수
   */
  const findImageDay = useCallback((month: number, date: number) => imageDays.find((day) => day.date === date && day.month === month && day.year === year), [imageDays, year])

  /**
   * 날짜 셀을 렌더링하는 함수
   */
  const renderDayCell = useCallback(
    (dayInfo: DayInfo, index: number) => {
      const imageDay = findImageDay(dayInfo.month, dayInfo.date)
      const isFirstOfMonth = dayInfo.date === 1
      const isToday = dayInfo.month === today.month && dayInfo.date === today.date

      const handleDayClick = () => {
        if (imageDay?.imageUrl) {
          handleImageClick(imageDay.imageUrl, dayInfo.month, dayInfo.date)
        }
      }

      return (
        <div key={index} className="calendar-timeline-day-wrapper">
          {isFirstOfMonth && <div className="calendar-timeline-month-label">{dayInfo.monthName}</div>}
          <div className={`calendar-timeline-day ${imageDay ? "calendar-timeline-day-with-image" : ""} ${isToday ? "calendar-timeline-day-today" : ""}`} onClick={handleDayClick}>
            {imageDay?.imageUrl ? (
              <div className="calendar-timeline-day-image-wrapper">
                <img src={imageDay.imageUrl} alt={`${dayInfo.date}`} className="calendar-timeline-day-image" draggable="false" />
                <span className="calendar-timeline-day-number-overlay">{dayInfo.date}</span>
              </div>
            ) : (
              <span className="calendar-timeline-day-number">{dayInfo.date}</span>
            )}
          </div>
        </div>
      )
    },
    [findImageDay, today.month, today.date, handleImageClick]
  )

  /**
   * 이미지 프리뷰 모달을 렌더링하는 함수
   */
  const renderImagePreview = useCallback(() => {
    if (!selectedImage) return null

    const previewDate = `${MONTH_NAMES[selectedImage.month - 1]} ${selectedImage.date}, ${year}`

    return (
      <div className="calendar-image-preview-container" onClick={handleClosePreview}>
        <div className="calendar-image-preview-card" onClick={(e) => e.stopPropagation()}>
          <img src={selectedImage.url} alt={`${selectedImage.month}/${selectedImage.date}`} className="calendar-image-preview-img" />
          <div className="calendar-image-preview-date">{previewDate}</div>
        </div>
      </div>
    )
  }, [selectedImage, year, handleClosePreview])

  return (
    <>
      <div className="calendar-timeline-container">
        <div
          ref={scrollContainerRef}
          className={`calendar-timeline-scroll ${dragState.hasMoved ? "dragging" : ""}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div className="calendar-timeline-days">{yearDays.map(renderDayCell)}</div>
        </div>
      </div>

      {renderImagePreview()}
    </>
  )
}
