"use client"

import { CursorChat } from "@/components/cursorChat/CursorChat"
import { UserCount } from "@/components/cursorChat/UserCount"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

export default function CursorChatPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        position: "relative",
        background: "linear-gradient(135deg, #fef3f8 0%, #fff5f7 20%, #fef8f4 40%, #fffbf0 60%, #f7fdf9 80%, #f0f9ff 100%)",
        fontFamily: GeistSans.style.fontFamily,
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "32px",
          left: "32px",
          zIndex: 1000,
          padding: "32px",
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)",
          border: "1px solid rgba(0, 0, 0, 0.04)",
          maxWidth: "400px",
          backdropFilter: "blur(20px)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)"
          e.currentTarget.style.boxShadow = "0 8px 12px -2px rgba(0, 0, 0, 0.06), 0 16px 24px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)"
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "8px",
              color: "#111827",
              letterSpacing: "-0.025em",
              lineHeight: "1.2",
            }}
          >
            Cursor Chat
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#6b7280",
              lineHeight: "1.6",
              fontWeight: 400,
            }}
          >
            Chat with other users in real-time
          </p>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "14px",
              color: "#374151",
              marginBottom: "4px",
            }}
          >
            <kbd
              style={{
                padding: "5px 10px",
                background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: GeistMono.style.fontFamily,
                fontWeight: 600,
                color: "#111827",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
                minWidth: "32px",
                textAlign: "center",
                transition: "all 0.15s ease",
              }}
            >
              /
            </kbd>
            <span style={{ flex: 1, fontWeight: 500 }}>Start chat</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "14px",
              color: "#374151",
            }}
          >
            <kbd
              style={{
                padding: "5px 10px",
                background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: GeistMono.style.fontFamily,
                fontWeight: 600,
                color: "#111827",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
                minWidth: "32px",
                textAlign: "center",
                transition: "all 0.15s ease",
              }}
            >
              Esc
            </kbd>
            <span style={{ flex: 1, fontWeight: 500 }}>Close chat</span>
          </div>
        </div>

        <div
          style={{
            height: "1px",
            background: "linear-gradient(to right, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent)",
            margin: "28px 0",
            border: "none",
          }}
        />

        <div>
          <UserCount />
        </div>
      </div>
      <CursorChat />
    </div>
  )
}
