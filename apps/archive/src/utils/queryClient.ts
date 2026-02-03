import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 데이터 유지 시간 (10분)
      gcTime: 1000 * 60 * 60 * 1, // 캐시 메모리 유지 시간 (1시간)
      // retry: 2 // 실패 시 2번 재시도
    },
  },
})
