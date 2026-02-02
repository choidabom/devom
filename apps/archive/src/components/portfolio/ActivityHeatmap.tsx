"use client"

import { useEffect, useState } from "react"
import "@/styles/heatmap.css"

interface ActivityData {
  date: string
  count: number
}

interface ActivityHeatmapProps {
  compact?: boolean
}

export const ActivityHeatmap = ({ compact = false }: ActivityHeatmapProps) => {
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [totalActivities, setTotalActivities] = useState(0)

  useEffect(() => {
    // Generate activity data for the last 365 days
    const today = new Date()
    const activityData: ActivityData[] = []
    let total = 0

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      // Random activity count (0-10) - in real app, this would come from API
      const count = Math.floor(Math.random() * 11)
      total += count
      activityData.push({
        date: date.toISOString().split("T")[0] || "",
        count,
      })
    }

    setActivities(activityData)
    setTotalActivities(total)
  }, [])

  const getActivityLevel = (count: number): string => {
    if (count === 0) return "level-0"
    if (count <= 2) return "level-1"
    if (count <= 4) return "level-2"
    if (count <= 7) return "level-3"
    return "level-4"
  }

  return (
    <div className={`heatmap-container ${compact ? "heatmap-compact" : ""}`}>
      <div className="heatmap-header">
        <h3 className="heatmap-title">Activity Overview</h3>
        <span className="heatmap-stats">{totalActivities} activities in 2025</span>
      </div>
      <div className="heatmap-grid-wrapper">
        <div className="heatmap-grid">
          {activities.map((activity, index) => (
            <div key={index} className={`heatmap-cell ${getActivityLevel(activity.count)}`} title={`${activity.date}: ${activity.count} activities`} />
          ))}
        </div>
      </div>
      {!compact && (
        <div className="heatmap-legend">
          <span className="heatmap-legend-label">Less</span>
          <div className="heatmap-legend-scale">
            <div className="heatmap-cell level-0" />
            <div className="heatmap-cell level-1" />
            <div className="heatmap-cell level-2" />
            <div className="heatmap-cell level-3" />
            <div className="heatmap-cell level-4" />
          </div>
          <span className="heatmap-legend-label">More</span>
        </div>
      )}
    </div>
  )
}
