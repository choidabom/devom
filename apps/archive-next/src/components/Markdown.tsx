import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = "" }: MarkdownProps) {
  return (
    <div className={`prose prose-neutral dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-semibold mb-3 text-neutral-800 dark:text-neutral-200">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xl font-medium mb-2 text-neutral-700 dark:text-neutral-300">{children}</h3>,
          p: ({ children }) => <p className="mb-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">{children}</p>,
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
            }
            return <code className={className}>{children}</code>;
          },
          pre: ({ children }) => <pre className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 italic text-neutral-600 dark:text-neutral-400 mb-4">{children}</blockquote>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside mb-4 text-neutral-600 dark:text-neutral-400">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-4 text-neutral-600 dark:text-neutral-400">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          a: ({ href, children }) => (
            <a href={href} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
