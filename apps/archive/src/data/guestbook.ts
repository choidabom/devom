import { GuestbookEntry } from "../types/guestbook"

// Default entries with realistic dates
export const defaultGuestbookEntries: GuestbookEntry[] = [
  {
    id: "1",
    name: "Sarah",
    message: "This is incredible! The iMessage style guestbook is such a creative touch 💙",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  },
  {
    id: "2",
    name: "Mike",
    message: "Love the draggable cards! Super smooth animations.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
  {
    id: "3",
    name: "Emma",
    message: "The attention to detail here is amazing. Great work! ✨",
    date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
  },
  {
    id: "4",
    name: "Alex",
    message: "Really impressed with the floating window on desktop. Feels native!",
    date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
  },
]

// Load entries from localStorage or use defaults
export const loadGuestbookEntries = (): GuestbookEntry[] => {
  if (typeof window === "undefined") return defaultGuestbookEntries

  try {
    const stored = localStorage.getItem("guestbook_entries")
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Failed to load guestbook entries:", error)
  }

  return defaultGuestbookEntries
}

// Save entries to localStorage
export const saveGuestbookEntries = (entries: GuestbookEntry[]) => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("guestbook_entries", JSON.stringify(entries))
  } catch (error) {
    console.error("Failed to save guestbook entries:", error)
  }
}

// Load saved user name
export const loadUserName = (): string => {
  if (typeof window === "undefined") return ""

  try {
    return localStorage.getItem("guestbook_user_name") || ""
  } catch (error) {
    console.error("Failed to load user name:", error)
    return ""
  }
}

// Save user name
export const saveUserName = (name: string) => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("guestbook_user_name", name)
  } catch (error) {
    console.error("Failed to save user name:", error)
  }
}
