"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  children: ReactNode;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  title: string;
}

export function CollapsibleSection({
  children,
  collapsed,
  onCollapsedChange,
  title,
}: CollapsibleSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    if (contentRef.current) {
      if (collapsed) {
        setHeight(contentRef.current.scrollHeight);
        requestAnimationFrame(() => {
          setHeight(0);
        });
      } else {
        setHeight(contentRef.current.scrollHeight);
        const timer = setTimeout(() => setHeight("auto"), 300);
        return () => clearTimeout(timer);
      }
    }
  }, [collapsed]);

  return (
    <div className="relative border-b border-white/10 pb-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>

        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className=" z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label={collapsed ? "Expand section" : "Collapse section"}
          aria-expanded={!collapsed}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              collapsed ? "-rotate-90" : "rotate-0"
            )}
          />
        </button>
      </div>
      <div
        ref={contentRef}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          collapsed && "opacity-0"
        )}
        aria-hidden={collapsed}
      >
        {children}
      </div>
    </div>
  );
}
