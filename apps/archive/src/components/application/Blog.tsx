import type { JSX } from "react"

const Blog = (): JSX.Element => {
  const handleAddBlogLink = (): void => {
    const blogLink = "https://bo5mi.tistory.com/"
    window.open(blogLink, "_blank")
  }

  return (
    <div className="h-full w-full">
      <button onClick={handleAddBlogLink} className="h-full w-full border-none bg-transparent p-0 cursor-pointer" aria-label="Open Blog in new tab">
        <img src="./image/blog.png" alt="Blog preview" className="h-full w-full object-cover" />
      </button>
    </div>
  )
}

export default Blog
