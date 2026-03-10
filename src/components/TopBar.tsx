"use client";

import ThemeToggle from "./ThemeToggle";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 w-full h-14 flex items-center justify-end px-6 bg-[var(--bg-primary)]/80 backdrop-blur-sm border-b border-[var(--border-color)]">
      <ThemeToggle />
    </header>
  );
}
