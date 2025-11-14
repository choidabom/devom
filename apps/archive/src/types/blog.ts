export interface BlogPost {
  id: string
  title: string
  date: string
  category: string
  tags: string[]
  excerpt: string
  content: string
  readingTime: number
  published: boolean
}

export interface BlogCategory {
  id: string
  name: string
  count: number
}
