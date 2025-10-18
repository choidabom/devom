import type { MDXComponents } from "mdx/types"
import Image from "next/image"
import "./styles/md.css"

interface CustomImageProps {
  src?: string
  alt?: string
  className?: string
  width?: number
  height?: number
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Custom image component with better error handling and accessibility
    img: ({ src, alt, className, width, height, ...props }: CustomImageProps) => {
      if (!src) {
        return null
      }

      return (
        <Image
          className={className || "img"}
          sizes="(max-width: 640px) 100vw, 576px"
          width={width || 1000}
          height={height || 1000}
          style={{ width: "100%", height: "auto" }}
          priority={false}
          unoptimized={true}
          alt={alt || ""}
          src={src}
          loading="lazy"
          {...props}
        />
      )
    },

    // Enhanced heading components with better accessibility
    h1: ({ children, ...props }) => (
      <h1 {...props} className="heading-1">
        {children}
      </h1>
    ),

    h2: ({ children, ...props }) => (
      <h2 {...props} className="heading-2">
        {children}
      </h2>
    ),

    h3: ({ children, ...props }) => (
      <h3 {...props} className="heading-3">
        {children}
      </h3>
    ),

    // Enhanced link component with better accessibility
    a: ({ href, children, ...props }) => (
      <a href={href} {...props} className="link" target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}>
        {children}
      </a>
    ),

    // Enhanced code component
    code: ({ children, className, ...props }) => (
      <code {...props} className={`code ${className || ""}`}>
        {children}
      </code>
    ),

    // Enhanced pre component
    pre: ({ children, ...props }) => (
      <pre {...props} className="pre">
        {children}
      </pre>
    ),

    ...components,
  }
}
