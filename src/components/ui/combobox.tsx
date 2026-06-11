"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface ComboboxItem {
  value: string;
  label: string;
  secondaryLabel?: string;
}

interface ComboboxProps {
  items: ComboboxItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = "Seçiniz...",
  searchPlaceholder = "Ara...",
  emptyText = "Sonuç bulunamadı.",
  className,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Normalize Turkish characters for searching
  const normalizeText = (text: string): string => {
    return text
      .toLocaleLowerCase("tr-TR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c");
  };

  // Find the label of the currently selected item
  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === value),
    [items, value]
  );

  // Filter items based on search query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = normalizeText(searchQuery);
    return items.filter(
      (item) =>
        normalizeText(item.label).includes(query) ||
        (item.secondaryLabel && normalizeText(item.secondaryLabel).includes(query))
    );
  }, [items, searchQuery]);

  // Sync searchQuery with selectedItem when closed
  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery(selectedItem ? selectedItem.label : "");
    }
  }, [isOpen, selectedItem]);

  // Click outside handler
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset highlighted index when filtered items change or dropdown opens
  React.useEffect(() => {
    setHighlightedIndex(filteredItems.length > 0 ? 0 : -1);
  }, [filteredItems, isOpen]);

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const listEl = listRef.current;
    const activeEl = listEl.children[highlightedIndex] as HTMLElement;
    if (!activeEl) return;

    const listHeight = listEl.clientHeight;
    const listScrollTop = listEl.scrollTop;
    const activeHeight = activeEl.clientHeight;
    const activeTop = activeEl.offsetTop;

    if (activeTop < listScrollTop) {
      listEl.scrollTop = activeTop;
    } else if (activeTop + activeHeight > listScrollTop + listHeight) {
      listEl.scrollTop = activeTop + activeHeight - listHeight;
    }
  }, [highlightedIndex]);

  const handleSelect = (itemValue: string) => {
    onValueChange(itemValue);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredItems.length === 0
            ? -1
            : prev + 1 >= filteredItems.length
            ? 0
            : prev + 1
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredItems.length === 0
            ? -1
            : prev - 1 < 0
            ? filteredItems.length - 1
            : prev - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredItems.length
        ) {
          handleSelect(filteredItems[highlightedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Select the full text on focus so user can type to search easily
    setTimeout(() => {
      inputRef.current?.select();
    }, 50);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("");
    setSearchQuery("");
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
    >
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pr-16 pl-8 h-9 shadow-xs"
        />
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Search className="h-4 w-4" />
        </div>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 rounded-lg border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 max-h-60 overflow-hidden flex flex-col animate-in fade-in-50 slide-in-from-top-1 duration-100">
          <div
            ref={listRef}
            className="overflow-y-auto py-1 max-h-60"
            role="listbox"
          >
            {filteredItems.length === 0 ? (
              <div className="py-3 px-4 text-sm text-muted-foreground text-center">
                {emptyText}
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = item.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={item.value}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "relative flex w-full cursor-pointer items-center justify-between py-2 px-3.5 text-sm select-none transition-colors",
                      isHighlighted && "bg-accent text-accent-foreground",
                      isSelected && "font-medium bg-primary/10 text-primary hover:bg-primary/15"
                    )}
                    onMouseDown={(e) => {
                      // Prevent input blur before selection is processed
                      e.preventDefault();
                      handleSelect(item.value);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-4">
                      <span className="truncate">{item.label}</span>
                      {item.secondaryLabel && (
                        <span
                          className={cn(
                            "text-xs text-muted-foreground shrink-0",
                            isSelected && "text-primary/70"
                          )}
                        >
                          {item.secondaryLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
