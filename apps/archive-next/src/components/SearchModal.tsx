import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SearchItem {
  title: string;
  path: string;
  description?: string;
  category: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const searchItems: SearchItem[] = [
  {
    title: "Archive",
    path: "/archive",
    description: "Main archive page",
    category: "Navigation",
  },
  {
    title: "Projects",
    path: "/archive/projects",
    description: "Long-term development projects",
    category: "Projects",
  },
  {
    title: "Photos",
    path: "/archive/photos",
    description: "Photography and visual content",
    category: "Media",
  },
  {
    title: "Posts",
    path: "/archive/posts",
    description: "Blog posts and articles",
    category: "Content",
  },
  {
    title: "Experiments",
    path: "/archive/experiments",
    description: "Technical experiments and prototypes",
    category: "Research",
  },
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filteredItems = searchItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        router.push(filteredItems[selectedIndex].path);
        onClose();
      }
    }
  };

  const handleItemClick = (item: SearchItem) => {
    router.push(item.path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Modal */}
      <div className="w-full max-w-2xl mx-4">
        <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden">
          {/* Search Input */}
          <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-700/50">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search pages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-xl placeholder-neutral-500 dark:placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 outline-none font-medium"
            />
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">No results found</div>
            ) : (
              filteredItems.map((item, index) => (
                <div
                  key={item.path}
                  onClick={() => handleItemClick(item)}
                  className={`p-4 cursor-pointer border-b border-neutral-100/50 dark:border-neutral-800/50 last:border-b-0 transition-colors ${
                    index === selectedIndex ? "bg-blue-50/80 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100" : "hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{item.title}</div>
                      {item.description && <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{item.description}</div>}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 bg-neutral-100/80 dark:bg-neutral-800/80 px-2 py-1 rounded">{item.category}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-neutral-50/80 dark:bg-neutral-800/80 border-t border-neutral-200/50 dark:border-neutral-700/50">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center space-x-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
              </div>
              <span>
                {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
