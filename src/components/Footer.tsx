import { Link } from "react-router-dom";
import { Instagram, Linkedin } from "lucide-react";
import { FOOTER, SOCIAL_LINKS, BRAND } from "@/constants/content";

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-display text-xl font-bold mb-3">{BRAND.name}</h3>
            <p className="text-background/70 text-sm max-w-md">
              {BRAND.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Links</h4>
            <ul className="space-y-2">
              {FOOTER.links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="font-display font-semibold mb-4">Connect</h4>
            <a
              href={`mailto:${FOOTER.contactEmail}`}
              className="text-sm text-background/70 hover:text-background transition-colors block mb-4"
            >
              {FOOTER.contactEmail}
            </a>
            <div className="flex gap-4">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/70 hover:text-background transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/70 hover:text-background transition-colors"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-background/20 mt-8 pt-8">
          <p className="text-sm text-background/50 text-center">
            {FOOTER.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
