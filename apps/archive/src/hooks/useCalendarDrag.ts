import { useRef, useState } from "react"
import { DECELERATION_FACTOR, DRAG_THRESHOLD, MIN_VELOCITY, MOMENTUM_MULTIPLIER, MOMENTUM_THRESHOLD, SCROLL_MULTIPLIER } from "../constants/calendar"

/**
 * 드래그 상태를 관리하는 인터페이스
 */
interface DragState {
  /** 현재 드래그 중인지 여부 */
  isDragging: boolean
  /** 드래그 시작 후 실제로 이동했는지 여부 (DRAG_THRESHOLD 초과 시 true) */
  hasMoved: boolean
  /** 드래그 시작 시점의 마우스 X 좌표 (컨테이너 기준) */
  startX: number
  /** 드래그 시작 시점의 스크롤 위치 */
  scrollLeft: number
  /** 이전 프레임의 마우스 X 좌표 (속도 계산용) */
  lastX: number
  /** 이전 프레임의 타임스탬프 (속도 계산용) */
  lastTime: number
}

/**
 * Calendar drag & momentum scroll hook
 *
 * Provides smooth drag-to-scroll functionality with momentum physics for the calendar timeline.
 * Tracks mouse position and velocity to create a natural scrolling experience.
 *
 * @returns {Object} Drag handlers and state
 * - scrollContainerRef: Ref to attach to the scrollable container
 * - dragState: Current drag state (isDragging, hasMoved)
 * - handleMouseDown: Mouse down event handler
 * - handleMouseMove: Mouse move event handler
 * - handleMouseUp: Mouse up event handler
 * - handleMouseLeave: Mouse leave event handler
 */
export const useCalendarDrag = () => {
  /** 스크롤 가능한 컨테이너 요소에 대한 ref */
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  /** 현재 마우스 이동 속도 (px/ms, 모멘텀 스크롤 계산용) */
  const velocityRef = useRef(0)
  /** 모멘텀 애니메이션의 requestAnimationFrame ID (취소용) */
  const animationRef = useRef<number | null>(null)

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    hasMoved: false,
    startX: 0,
    scrollLeft: 0,
    lastX: 0,
    lastTime: 0,
  })

  /**
   * 스크롤 컨테이너의 스크롤 동작을 설정
   * - "auto": 즉시 스크롤 (드래그 중 모멘텀 스크롤 시 사용)
   * - "smooth": 부드러운 스크롤 (일반 스크롤 시 사용)
   */
  const setScrollBehavior = (behavior: "auto" | "smooth") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollBehavior = behavior
    }
  }

  /**
   * 진행 중인 모멘텀 애니메이션을 취소
   * 드래그를 새로 시작할 때 이전 모멘텀을 중단하기 위해 호출
   */
  const cancelMomentumAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  /**
   * 모멘텀 스크롤을 적용
   * 드래그 종료 시 속도가 MOMENTUM_THRESHOLD를 초과하면 호출되어
   * 자연스러운 감속 애니메이션을 생성
   * - 속도가 MIN_VELOCITY 미만이 될 때까지 재귀적으로 실행
   * - 각 프레임마다 DECELERATION_FACTOR로 속도를 감소시켜 자연스러운 감속 효과 구현
   */
  const applyMomentum = () => {
    if (!scrollContainerRef.current || Math.abs(velocityRef.current) < MIN_VELOCITY) {
      setScrollBehavior("smooth")
      return
    }

    scrollContainerRef.current.scrollLeft -= velocityRef.current * MOMENTUM_MULTIPLIER
    velocityRef.current *= DECELERATION_FACTOR

    if (Math.abs(velocityRef.current) > MIN_VELOCITY) {
      animationRef.current = requestAnimationFrame(applyMomentum)
    } else {
      setScrollBehavior("smooth")
    }
  }

  /**
   * 마우스 다운 이벤트 핸들러
   * 드래그 시작을 초기화하고 현재 상태를 저장
   * - 진행 중인 모멘텀 애니메이션 취소
   * - 드래그 상태 초기화 (시작 위치, 스크롤 위치, 시간 등)
   * - 스크롤 동작을 "auto"로 설정하여 즉시 스크롤 가능하도록 함
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return

    cancelMomentumAnimation()

    setDragState({
      isDragging: true,
      hasMoved: false,
      startX: e.pageX - scrollContainerRef.current.offsetLeft,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      lastX: e.pageX,
      lastTime: Date.now(),
    })

    velocityRef.current = 0
    setScrollBehavior("auto")
  }

  /**
   * 마우스 이동 이벤트 핸들러
   * 드래그 중 마우스 이동을 추적하여 스크롤을 업데이트하고 속도를 계산
   * - DRAG_THRESHOLD를 초과하면 hasMoved를 true로 설정하고 preventDefault 실행
   * - 속도 계산: (현재 위치 - 이전 위치) / (현재 시간 - 이전 시간)
   * - 스크롤 위치: 시작 위치에서의 이동 거리에 SCROLL_MULTIPLIER를 곱해 적용
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !scrollContainerRef.current) return

    const currentX = e.pageX - scrollContainerRef.current.offsetLeft
    const moveDistance = Math.abs(currentX - dragState.startX)

    // DRAG_THRESHOLD 초과 시 실제 드래그 시작으로 간주
    if (moveDistance > DRAG_THRESHOLD && !dragState.hasMoved) {
      setDragState((prev) => ({ ...prev, hasMoved: true }))
      e.preventDefault()
    }

    // 실제 드래그가 시작된 경우에만 스크롤 및 속도 업데이트
    if (dragState.hasMoved || moveDistance > DRAG_THRESHOLD) {
      const currentTime = Date.now()
      const timeDiff = currentTime - dragState.lastTime

      // 시간 차이가 0보다 클 때만 속도 계산 (0으로 나누기 방지)
      if (timeDiff > 0) {
        velocityRef.current = (currentX - dragState.lastX) / timeDiff
      }

      setDragState((prev) => ({ ...prev, lastX: currentX, lastTime: currentTime }))

      // 시작 위치에서의 이동 거리에 배수를 적용하여 스크롤 위치 계산
      const walk = (currentX - dragState.startX) * SCROLL_MULTIPLIER
      scrollContainerRef.current.scrollLeft = dragState.scrollLeft - walk
    }
  }

  /**
   * 드래그 종료 처리
   * 속도가 MOMENTUM_THRESHOLD를 초과하면 모멘텀 스크롤을 시작하고,
   * 그렇지 않으면 일반 스크롤 동작으로 복원
   */
  const finalizeDrag = () => {
    setDragState((prev) => ({ ...prev, isDragging: false }))

    if (Math.abs(velocityRef.current) > MOMENTUM_THRESHOLD) {
      applyMomentum()
    } else {
      setScrollBehavior("smooth")
    }
  }

  /**
   * 마우스 업 이벤트 핸들러
   * 드래그 종료를 처리
   */
  const handleMouseUp = () => {
    finalizeDrag()
  }

  /**
   * 마우스 리브 이벤트 핸들러
   * 마우스가 컨테이너를 벗어날 때 드래그 중이면 종료 처리
   */
  const handleMouseLeave = () => {
    if (dragState.isDragging) {
      finalizeDrag()
    }
  }

  return {
    scrollContainerRef,
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  }
}
