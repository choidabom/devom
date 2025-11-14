import { useState } from "react"
import { motion } from "framer-motion"
import { blogPosts, blogCategories } from "../../data/blog"
import { BlogPost } from "../../types/blog"
import "../../styles/blog.css"

export const BlogList = () => {
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredPosts = blogPosts.filter((post) => {
    if (selectedCategory === "all") return post.published
    return post.category.toLowerCase() === selectedCategory && post.published
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  return (
    <div className="blog-container">
      <div className="blog-header">
        <h1 className="blog-title">Blog</h1>
        <p className="blog-subtitle">Thoughts, tutorials, and insights</p>
      </div>

      <div className="blog-categories">
        {blogCategories.map((category) => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? "active" : ""}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name} <span className="category-count">({category.count})</span>
          </button>
        ))}
      </div>

      <div className="blog-posts">
        {filteredPosts.map((post, index) => (
          <motion.article
            key={post.id}
            className="blog-post-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="post-meta">
              <time className="post-date">{formatDate(post.date)}</time>
              <span className="post-reading-time">{post.readingTime} min read</span>
            </div>
            <h2 className="post-title">
              <a href={`/blog/${post.id}`}>{post.title}</a>
            </h2>
            <p className="post-excerpt">{post.excerpt}</p>
            <div className="post-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="post-tag">
                  {tag}
                </span>
              ))}
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  )
}
