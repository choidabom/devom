export interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number // in seconds
  coverColor: string // vinyl color
  year: string
}

export interface Playlist {
  id: string
  name: string
  tracks: Track[]
}
