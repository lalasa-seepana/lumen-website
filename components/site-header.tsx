"use client";

import { useEffect, useRef, useState } from "react";
import { Arrow } from "@/components/icons";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <a href="#welcome" className="brand" aria-label="Lumen home">
        lumen<span className="brand-star">✳︎</span>
        <span className="brand-subtitle">BEAUTY & CARE</span>
      </a>
      <nav
        id="main-navigation"
        className={`main-nav ${menuOpen ? "is-open" : ""}`}
        aria-label="Main navigation"
        onClick={() => setMenuOpen(false)}
      >
        <a href="#rituals">Care menu</a>
        <a href="#consultation">Consultation</a>
        <a href="#consultation" className="mobile-consultation">
          Begin your care <Arrow />
        </a>
      </nav>
      <a href="#consultation" className="header-cta">
        Begin your care <Arrow diagonal />
      </a>
      <button
        ref={menuButton}
        type="button"
        className="menu-toggle"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span className={menuOpen ? "menu-lines open" : "menu-lines"} />
      </button>
    </header>
  );
}
