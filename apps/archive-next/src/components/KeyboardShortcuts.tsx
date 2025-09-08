"use client";

import { useSearch } from "@/context/SearchContext";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { SearchModal } from "./SearchModal";

export function KeyboardShortcuts() {
  const { isSearchOpen, openSearch, closeSearch } = useSearch();

  useKeyboardShortcut({
    key: "/",
    metaKey: true,
    onKeyDown: openSearch,
  });

  useKeyboardShortcut({
    key: "Escape",
    onKeyDown: closeSearch,
  });

  return <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />;
}
