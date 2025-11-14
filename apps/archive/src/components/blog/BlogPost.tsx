import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { blogPosts } from "../../data/blog"
import { BlogPost as BlogPostType } from "../../types/blog"
import "../../styles/blog.css"

interface BlogPostProps {
  postId: string
}

export const BlogPost = ({ postId }: BlogPostProps) => {
  const [post, setPost] = useState<BlogPostType | null>(null)

  useEffect(() => {
    const foundPost = blogPosts.find((p) => p.id === postId)
    setPost(foundPost || null)
  }, [postId])

  if (!post) {
    return (
      <div className="blog-container">
        <div className="blog-post-not-found">
          <h1>Post not found</h1>
          <p>The blog post you're looking for doesn't exist.</p>
          <a href="/blog" className="back-link">
            ← Back to Blog
          </a>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  return (
    <motion.div
      className="blog-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <article className="blog-post">
        <header className="blog-post-header">
          <a href="/blog" className="back-link">
            ← Back to Blog
          </a>
          <div className="post-meta">
            <time className="post-date">{formatDate(post.date)}</time>
            <span className="post-reading-time">{post.readingTime} min read</span>
          </div>
          <h1 className="blog-post-title">{post.title}</h1>
          <div className="post-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="post-tag">
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="blog-post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

        <footer className="blog-post-footer">
          <a href="/blog" className="back-link">
            ← Back to Blog
          </a>
        </footer>
      </article>
    </motion.div>
  )
}
