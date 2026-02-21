export const STORAGE_KEYS = {
  ENTRIES: "guestbook-entries",
  USER_NAME: "guestbook-user-name",
  MY_MESSAGE_IDS: "guestbook-my-message-ids",
} as const

export const LIMITS = {
  MESSAGE_MAX_LENGTH: 500,
  NAME_MAX_LENGTH: 15,
} as const
