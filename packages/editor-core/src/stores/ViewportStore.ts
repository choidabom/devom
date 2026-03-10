import { makeAutoObservable } from "mobx"

export class ViewportStore {
  zoom = 1
  panX = 0
  panY = 0

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  setZoom(zoom: number) {
    this.zoom = Math.max(0.1, Math.min(5, zoom))
  }

  zoomIn() {
    this.setZoom(this.zoom * 1.2)
  }

  zoomOut() {
    this.setZoom(this.zoom / 1.2)
  }

  resetZoom() {
    this.zoom = 1
    this.panX = 0
    this.panY = 0
  }

  pan(dx: number, dy: number) {
    this.panX += dx
    this.panY += dy
  }

  setPan(x: number, y: number) {
    this.panX = x
    this.panY = y
  }
}
