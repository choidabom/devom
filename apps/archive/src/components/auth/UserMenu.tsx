"use client"

import { useAuth } from "@/hooks/useAuth"

export function UserMenu() {
  const { user, isLoading, handleSignInWithGithub, handleSignOut } = useAuth()

  // 로딩 중이면 아무것도 표시 안 함
  if (isLoading) return null

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {user && (
        <img
          src={user.user_metadata.avatar_url}
          alt={user.user_metadata.name || "User avatar"}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      )}

      <button
        onClick={user ? handleSignOut : handleSignInWithGithub}
        style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "14px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {user ? "Sign Out" : "Sign in with GitHub"}
      </button>
    </div>
  )
}
