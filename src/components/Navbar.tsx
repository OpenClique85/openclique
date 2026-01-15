import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, BRAND } from "@/constants/content";
import wordmark from "@/assets/openclique-wordmark.svg";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Wordmark */}
          <Link to="/" className="flex items-center gap-2">
            <img src={wordmark} alt={BRAND.name} className="h-6 md:h-8 w-auto text-foreground" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.href) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              size="sm"
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/80 hover:scale-105 transition-all"
            >
              <Link to="/pilot">Join the Pilot</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 transition-all"
            >
              <Link to="/partners">Partner With Us</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="bg-gold text-gold-foreground hover:bg-gold/80 hover:scale-105 transition-all"
            >
              <Link to="/work-with-us">Work With Us</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href) ? "text-primary" : "text-muted-foreground"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button
                  size="sm"
                  asChild
                  className="justify-start bg-primary text-primary-foreground"
                >
                  <Link to="/pilot" onClick={() => setIsOpen(false)}>Join the Pilot</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="justify-start bg-secondary text-secondary-foreground"
                >
                  <Link to="/partners" onClick={() => setIsOpen(false)}>Partner With Us</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="justify-start bg-gold text-gold-foreground"
                >
                  <Link to="/work-with-us" onClick={() => setIsOpen(false)}>Work With Us</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}