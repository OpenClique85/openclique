/**
 * =============================================================================
 * NAVBAR.TSX - SITE-WIDE NAVIGATION BAR
 * =============================================================================
 * 
 * The sticky header that appears on every page. Contains:
 * - Logo (links to homepage)
 * - Main navigation links
 * - CTA buttons (Join the Pilot + Get Involved dropdown)
 * - Mobile hamburger menu
 * 
 * TO EDIT NAVIGATION LINKS:
 * Edit NAV_LINKS in src/constants/content.ts
 * 
 * VISUAL STRUCTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  [Logo]    Home  Quests  How It Works  ...  [Join] [Get ▼] │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * MOBILE VIEW:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  [Logo]                                              [☰]    │
 * ├─────────────────────────────────────────────────────────────┤
 * │  Home                                                       │
 * │  Quests                                                     │
 * │  How It Works                                               │
 * │  ...                                                        │
 * │  ─────────────────────────────────────────────────────────  │
 * │  [Join the Pilot]                                           │
 * │  Get Involved:                                              │
 * │  • For Creators                                             │
 * │  • Partner With Us                                          │
 * │  • Work With Us                                             │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * COLOR-CODED DROPDOWN ITEMS:
 * - Creators: Purple dot (text-creator / bg-creator)
 * - Partners: Orange dot (text-sunset / bg-sunset)
 * - Work With Us: Navy dot (text-navy / bg-navy)
 * 
 * =============================================================================
 */

import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, ChevronDown, LogIn, LogOut, User, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { NAV_LINKS, BRAND } from "@/constants/content";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";

export function Navbar() {
  // Track if mobile menu is open
  const [isOpen, setIsOpen] = useState(false);
  
  // Get current page URL to highlight active nav link
  const location = useLocation();
  
  // Auth state
  const { user, signOut, isAdmin } = useAuth();

  // Helper: Check if a nav link matches current page
  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* ---------------------------------------------------------------- */}
          {/* LOGO - Links to homepage */}
          {/* ---------------------------------------------------------------- */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt={BRAND.name} className="h-10 md:h-12 w-auto" />
          </Link>

          {/* ---------------------------------------------------------------- */}
          {/* DESKTOP NAVIGATION - Main links */}
          {/* Hidden on mobile (md:flex means only show on medium+ screens) */}
          {/* ---------------------------------------------------------------- */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary whitespace-nowrap ${
                  isActive(link.href) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {/* My Quests - visible when logged in */}
            {user && (
              <Link
                to="/my-quests"
                className={`text-sm font-medium transition-colors hover:text-primary whitespace-nowrap ${
                  isActive('/my-quests') ? "text-primary" : "text-muted-foreground"
                }`}
              >
                My Quests
              </Link>
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* DESKTOP CTA BUTTONS */}
          {/* Primary: Join the Pilot (solid teal button) */}
          {/* Secondary: Get Involved dropdown (outline button) */}
          {/* ---------------------------------------------------------------- */}
          <div className="hidden md:flex items-center gap-3">
            {/* Primary CTA */}
            <Button
              size="sm"
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all px-4"
            >
              <Link to="/quests">Find Your Quest</Link>
            </Button>
            
            {/* Secondary CTA - Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 px-4"
                >
                  Get Involved
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Creators - Purple accent */}
                <DropdownMenuItem asChild>
                  <Link 
                    to="/creators" 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-creator" />
                    For Creators
                  </Link>
                </DropdownMenuItem>
                {/* Partners - Orange/Sunset accent */}
                <DropdownMenuItem asChild>
                  <Link 
                    to="/partners" 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-sunset" />
                    Partner With Us
                  </Link>
                </DropdownMenuItem>
                {/* Work With Us - Navy accent */}
                <DropdownMenuItem asChild>
                  <Link 
                    to="/work-with-us" 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-navy" />
                    Work With Us
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification Bell (only for logged in users) */}
            {user && <NotificationBell />}

            {/* Auth Section */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="gap-2 px-3">
                    <User className="h-4 w-4" />
                    <span className="max-w-[100px] truncate text-sm">
                      {user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="flex items-center gap-2 cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="flex items-center gap-2 cursor-pointer text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" variant="ghost" asChild className="gap-2">
                <Link to="/auth">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* MOBILE MENU BUTTON (hamburger icon) */}
          {/* Only visible on mobile (md:hidden) */}
          {/* ---------------------------------------------------------------- */}
          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* MOBILE MENU (expanded view) */}
        {/* Only renders when isOpen is true */}
        {/* ------------------------------------------------------------------ */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {/* Main navigation links */}
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href) ? "text-primary" : "text-muted-foreground"
                  }`}
                  onClick={() => setIsOpen(false)} // Close menu after clicking
                >
                  {link.label}
                </Link>
              ))}
              
              {/* CTA section (separated by border) */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {/* Primary CTA */}
                <Button
                  size="sm"
                  asChild
                  className="justify-start bg-primary text-primary-foreground"
                >
                  <Link to="/quests" onClick={() => setIsOpen(false)}>Find Your Quest</Link>
                </Button>
                
                {/* Secondary options label */}
                <p className="text-xs text-muted-foreground pt-2 pb-1">Get Involved</p>
                
                {/* Creators link */}
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  className="justify-start gap-2"
                >
                  <Link to="/creators" onClick={() => setIsOpen(false)}>
                    <span className="w-2 h-2 rounded-full bg-creator" />
                    For Creators
                  </Link>
                </Button>
                
                {/* Partners link */}
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  className="justify-start gap-2"
                >
                  <Link to="/partners" onClick={() => setIsOpen(false)}>
                    <span className="w-2 h-2 rounded-full bg-sunset" />
                    Partner With Us
                  </Link>
                </Button>
                
                {/* Work With Us link */}
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  className="justify-start gap-2"
                >
                  <Link to="/work-with-us" onClick={() => setIsOpen(false)}>
                    <span className="w-2 h-2 rounded-full bg-navy" />
                    Work With Us
                  </Link>
                </Button>
              </div>

              {/* Auth section for mobile */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {user ? (
                  <>
                    <p className="text-xs text-muted-foreground pb-1">
                      Signed in as {user.email?.split('@')[0]}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      className="justify-start gap-2"
                    >
                      <Link to="/my-quests" onClick={() => setIsOpen(false)}>
                        <ClipboardList className="h-4 w-4" />
                        My Quests
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      className="justify-start gap-2"
                    >
                      <Link to="/profile" onClick={() => setIsOpen(false)}>
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="justify-start gap-2"
                      >
                        <Link to="/admin" onClick={() => setIsOpen(false)}>
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          Admin Dashboard
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="justify-start gap-2 text-destructive"
                      onClick={() => {
                        signOut();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="justify-start gap-2"
                  >
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
