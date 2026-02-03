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
import { Menu, X, ChevronDown, LogIn, LogOut, User, ClipboardList, Sparkles, Building2, Users, Plus, GraduationCap } from "lucide-react";
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
import { XPBadge } from "@/components/XPBadge";
import logo from "@/assets/logo.png";

export function Navbar() {
  // Track if mobile menu is open
  const [isOpen, setIsOpen] = useState(false);
  
  // Get current page URL to highlight active nav link
  const location = useLocation();
  
  // Auth state
  const { user, signOut, isAdmin, isCreator, isSponsor } = useAuth();

  // Helper: Check if a nav link matches current page
  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt={BRAND.name} className="h-9 w-auto" />
          </Link>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden md:flex items-center gap-1">
            {/* Core nav links */}
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-colors hover:bg-muted ${
                  isActive(link.href) ? "text-primary bg-primary/5" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {/* My Hub - consolidated profile link for logged in users */}
            {/* My Hub - consolidated profile link for logged in users */}
            {user && (
              <Link
                to="/profile"
                className={`text-sm font-medium px-3 py-2 rounded-md transition-colors hover:bg-muted flex items-center gap-1.5 ${
                  location.pathname === '/profile' || location.pathname.startsWith('/cliques') 
                    ? "text-primary bg-primary/5" 
                    : "text-muted-foreground"
                }`}
              >
                <Users className="h-4 w-4" />
                My Hub
              </Link>
            )}
          </div>

          {/* DESKTOP RIGHT SECTION */}
          <div className="hidden md:flex items-center gap-2">
            {/* Get Involved Dropdown - consolidates CTAs */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground">
                  Get Involved
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link to="/creators" className="flex items-center gap-2 cursor-pointer">
                    <span className="w-2 h-2 rounded-full bg-creator" />
                    For Creators
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/partners" className="flex items-center gap-2 cursor-pointer">
                    <span className="w-2 h-2 rounded-full bg-sunset" />
                    Partner With Us
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/work-with-us" className="flex items-center gap-2 cursor-pointer">
                    <span className="w-2 h-2 rounded-full bg-navy" />
                    Work With Us
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* XP Badge & Notification Bell */}
            {user && (
              <>
                <XPBadge />
                <NotificationBell />
              </>
            )}

            {/* Auth Section */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="gap-1.5 px-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border mb-1">
                    {user.email}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile?tab=cliques" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      My Cliques
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile?tab=quests" className="flex items-center gap-2 cursor-pointer">
                      <ClipboardList className="h-4 w-4" />
                      My Quests
                    </Link>
                  </DropdownMenuItem>
                  {isCreator && (
                    <DropdownMenuItem asChild>
                      <Link to="/creator" className="flex items-center gap-2 cursor-pointer">
                        <Sparkles className="h-4 w-4 text-creator" />
                        Creator Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isSponsor && (
                    <DropdownMenuItem asChild>
                      <Link to="/sponsor" className="flex items-center gap-2 cursor-pointer">
                        <Building2 className="h-4 w-4 text-sunset" />
                        Sponsor Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/enterprise" className="flex items-center gap-2 cursor-pointer">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          Enterprise Portal
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
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
              <Button size="sm" asChild>
                <Link to="/auth">Sign In</Link>
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
            <div className="flex flex-col gap-1">
              {/* Main navigation links */}
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                    isActive(link.href) ? "text-primary bg-primary/5" : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              

              {/* My Hub link for logged in users */}
              {user && (
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md mt-1 ${
                    location.pathname === '/profile' || location.pathname.startsWith('/cliques')
                      ? "text-primary bg-primary/5" 
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Users className="h-4 w-4" />
                  My Hub
                </Link>
              )}
              
              {/* Get Involved section */}
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground px-3 pb-2">Get Involved</p>
                <Link
                  to="/creators"
                  className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md text-muted-foreground hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-creator" />
                  For Creators
                </Link>
                <Link
                  to="/partners"
                  className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md text-muted-foreground hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-sunset" />
                  Partner With Us
                </Link>
                <Link
                  to="/work-with-us"
                  className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md text-muted-foreground hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-navy" />
                  Work With Us
                </Link>
              </div>

              {/* Auth section */}
              <div className="mt-3 pt-3 border-t border-border">
                {user ? (
                  <>
                    <p className="text-xs text-muted-foreground px-3 pb-2 truncate">
                      {user.email}
                    </p>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md text-muted-foreground hover:bg-muted"
                      onClick={() => setIsOpen(false)}
                    >
                      <Users className="h-4 w-4" />
                      My Hub
                    </Link>
                    {isCreator && (
                      <Link
                        to="/creator"
                        className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md text-muted-foreground hover:bg-muted"
                        onClick={() => setIsOpen(false)}
                      >
                        <Sparkles className="h-4 w-4 text-creator" />
                        Creator Portal
                      </Link>
                    )}
                    {isSponsor && (
                      <Link
                        to="/sponsor"
                        className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md text-muted-foreground hover:bg-muted"
                        onClick={() => setIsOpen(false)}
                      >
                        <Building2 className="h-4 w-4 text-sunset" />
                        Sponsor Portal
                      </Link>
                    )}
                    {isAdmin && (
                      <>
                        <Link
                          to="/enterprise"
                          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md text-muted-foreground hover:bg-muted"
                          onClick={() => setIsOpen(false)}
                        >
                          <GraduationCap className="h-4 w-4 text-primary" />
                          Enterprise Portal
                        </Link>
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md text-muted-foreground hover:bg-muted"
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          Admin
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => {
                        signOut();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 w-full text-sm font-medium px-3 py-2 rounded-md text-destructive hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Button size="sm" asChild className="mx-3">
                    <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
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
