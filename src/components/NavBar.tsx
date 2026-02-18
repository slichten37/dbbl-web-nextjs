"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/stats", label: "Stats", icon: "📊" },
  { href: "/admin", label: "Admin", icon: "⚙️" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: top bar */}
      <nav className="hidden md:flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <Link
          href="/"
          className="text-lg font-bold tracking-wider uppercase text-neon-cyan text-glow-cyan"
        >
          🎳 dbbl
        </Link>
        <div className="flex gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                  isActive
                    ? "text-neon-cyan bg-neon-cyan/10 text-glow-cyan"
                    : "text-foreground/50 hover:text-foreground/80 hover:bg-surface-light"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile: fixed bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-sm flex justify-around py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-neon-cyan text-glow-cyan"
                  : "text-foreground/40"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
