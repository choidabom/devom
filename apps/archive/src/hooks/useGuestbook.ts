import { useCallback, useRef, useEffect, useState } from "react"
import { useLocalStorageString } from "./useLocalStorage"
import { GuestbookEntry } from "../types/guestbook"
import { STORAGE_KEYS } from "../constants/guestbook"
import { createClient } from "../lib/supabase/client"
import { useAuth } from "./useAuth"

export function useGuestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useLocalStorageString(STORAGE_KEYS.USER_NAME)
  const [myMessageIds, setMyMessageIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.MY_MESSAGE_IDS)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    }
    return new Set()
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const supabase = createClient()

  // Fetch entries from Supabase
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("guestbook").select("*").order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching guestbook entries:", error)
      } else {
        setEntries(data || [])
      }
      setLoading(false)
    }

    fetchEntries()

    // Subscribe to real-time updates
    const channel = supabase
      .channel("guestbook_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "guestbook" }, (payload) => {
        console.log("New guestbook entry:", payload.new)
        // Avoid duplicate entries (optimistic update might already exist)
        setEntries((prev) => {
          const exists = prev.some((entry) => entry.id === payload.new.id)
          if (exists) return prev
          return [...prev, payload.new as GuestbookEntry]
        })
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "guestbook" }, (payload) => {
        console.log("Updated guestbook entry:", payload.new)
        setEntries((prev) => prev.map((entry) => (entry.id === payload.new.id ? (payload.new as GuestbookEntry) : entry)))
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "guestbook" }, (payload) => {
        console.log("Deleted guestbook entry:", payload.old)
        setEntries((prev) => prev.filter((entry) => entry.id !== payload.old.id))
      })
      .subscribe((status) => {
        console.log("Realtime subscription status:", status)
        if (status === "SUBSCRIBED") {
          console.log("✅ Successfully subscribed to guestbook realtime updates")
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Failed to subscribe to realtime updates. Check Supabase Realtime settings.")
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [entries])

  const addEntry = useCallback(
    async (message: string, name: string = userName) => {
      const trimmedMessage = message.trim()
      const trimmedName = name.trim()

      if (!trimmedMessage) return

      const displayName = trimmedName || "Anonymous"
      const newEntry: Omit<GuestbookEntry, "id" | "created_at"> = {
        user_id: user?.id || undefined,
        name: displayName,
        message: trimmedMessage,
        avatar_url: user?.user_metadata?.avatar_url || undefined,
      }

      // Optimistic update: Add entry immediately with temporary ID
      const tempId = `temp-${Date.now()}`
      const optimisticEntry: GuestbookEntry = {
        ...newEntry,
        id: tempId,
        created_at: new Date().toISOString(),
      }
      setEntries((prev) => [...prev, optimisticEntry])

      const { data, error } = await supabase.from("guestbook").insert([newEntry]).select()

      if (error) {
        console.error("Error adding guestbook entry:", error)
        alert("Failed to add message. Please try again.")
        // Rollback optimistic update on error
        setEntries((prev) => prev.filter((entry) => entry.id !== tempId))
        return
      }

      // Replace temp entry with real entry from server (has real ID and timestamp)
      if (data && data[0]) {
        const realEntry = data[0] as GuestbookEntry
        setEntries((prev) => prev.map((entry) => (entry.id === tempId ? realEntry : entry)))

        // Track this message as mine
        setMyMessageIds((prev) => {
          const updated = new Set(prev)
          updated.add(realEntry.id)
          localStorage.setItem(STORAGE_KEYS.MY_MESSAGE_IDS, JSON.stringify([...updated]))
          return updated
        })
      }

      // Save user preferences
      if (trimmedName) {
        setUserName(trimmedName)
      }
    },
    [userName, user, supabase, setUserName]
  )

  const shouldShowAvatar = useCallback(
    (index: number) => {
      if (index === 0) return true
      const currentEntry = entries[index]
      const previousEntry = entries[index - 1]
      if (!currentEntry || !previousEntry) return true
      return currentEntry.name !== previousEntry.name
    },
    [entries]
  )

  const isMyMessage = useCallback(
    (messageId: string) => {
      return myMessageIds.has(messageId)
    },
    [myMessageIds]
  )

  return {
    entries,
    loading,
    userName,
    messagesEndRef,
    setUserName,
    addEntry,
    shouldShowAvatar,
    isMyMessage,
  }
}
