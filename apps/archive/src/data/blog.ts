import { BlogPost } from "../types/blog"

export const blogPosts: BlogPost[] = [
  {
    id: "welcome-to-my-blog",
    title: "Welcome to My Blog",
    date: "2024-11-14",
    category: "General",
    tags: ["intro", "welcome"],
    excerpt: "A brief introduction to this blog and what you can expect to find here.",
    content: `
# Welcome to My Blog

This is the first post on my new blog. I'll be sharing thoughts, tutorials, and insights about web development, design, and technology.

## What to Expect

- Technical tutorials and guides
- Design principles and best practices
- Project showcases and case studies
- Personal thoughts on technology and development

Stay tuned for more content!
    `,
    readingTime: 2,
    published: true,
  },
  {
    id: "building-with-react-and-typescript",
    title: "Building Modern Web Apps with React and TypeScript",
    date: "2024-11-13",
    category: "Development",
    tags: ["React", "TypeScript", "Web Development"],
    excerpt: "Learn how to build type-safe, scalable web applications using React and TypeScript.",
    content: `
# Building Modern Web Apps with React and TypeScript

TypeScript has become an essential tool for building robust React applications. In this post, we'll explore why this combination is so powerful.

## Why TypeScript?

TypeScript adds static typing to JavaScript, which helps catch errors early and improves developer experience with better autocomplete and refactoring support.

## Setting Up a React + TypeScript Project

\`\`\`bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
\`\`\`

## Benefits

1. **Type Safety**: Catch errors at compile time
2. **Better IDE Support**: Improved autocomplete and refactoring
3. **Self-Documenting Code**: Types serve as inline documentation
4. **Easier Refactoring**: Confidence when making changes

## Conclusion

React and TypeScript together provide a powerful foundation for building scalable web applications.
    `,
    readingTime: 5,
    published: true,
  },
  {
    id: "design-principles-for-developers",
    title: "Design Principles Every Developer Should Know",
    date: "2024-11-12",
    category: "Design",
    tags: ["Design", "UI/UX", "Principles"],
    excerpt: "Essential design principles that will help you create better user interfaces.",
    content: `
# Design Principles Every Developer Should Know

As developers, understanding basic design principles can significantly improve the quality of our work. Here are some key principles to keep in mind.

## 1. Visual Hierarchy

Guide users' attention to the most important elements first. Use size, color, and positioning to create hierarchy.

## 2. Consistency

Maintain consistent patterns throughout your interface. This includes colors, typography, spacing, and interaction patterns.

## 3. White Space

Don't be afraid of empty space. White space (or negative space) helps create breathing room and improves readability.

## 4. Typography

Choose readable fonts and establish a clear typographic scale. Good typography can make or break your design.

## 5. Color Theory

Understand basic color theory and use a limited color palette. Too many colors can be overwhelming.

## Applying These Principles

Start small. Pick one principle and focus on improving it in your next project. Over time, these principles will become second nature.
    `,
    readingTime: 4,
    published: true,
  },
]

export const blogCategories = [
  { id: "all", name: "All Posts", count: blogPosts.length },
  { id: "development", name: "Development", count: blogPosts.filter((p) => p.category === "Development").length },
  { id: "design", name: "Design", count: blogPosts.filter((p) => p.category === "Design").length },
  { id: "general", name: "General", count: blogPosts.filter((p) => p.category === "General").length },
]
