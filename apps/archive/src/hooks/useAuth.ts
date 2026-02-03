"use client"

import { useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export function useAuth() {
  const queryClient = useQueryClient()

  // TanStack Query로 사용자 정보 관리
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser()

      // "Auth session missing!"은 로그아웃 상태를 의미하므로 에러가 아님
      if (error && error.message !== "Auth session missing!") {
        console.error("Failed to get user:", error.message)
      }

      return data.user
    },
    staleTime: Infinity, // 이벤트 기반으로만 갱신 (onAuthStateChange)
    gcTime: Infinity, // 캐시 유지
    refetchOnMount: false, // 마운트 시 재요청 안 함
    refetchOnWindowFocus: false, // 포커스 시 재요청 안 함
    refetchOnReconnect: false, // 재연결 시 재요청 안 함
  })

  // 인증 상태 변경 감지
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Query cache 업데이트
      queryClient.setQueryData(["user"], session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  const handleSignInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error("Sign in failed:", error)
      throw error
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Sign out failed:", error)
      throw error
    }
    // 로그아웃 후 캐시 무효화
    queryClient.setQueryData(["user"], null)
  }

  return {
    user: user ?? null,
    isLoading,
    error,
    handleSignInWithGithub,
    handleSignOut,
  }
}
