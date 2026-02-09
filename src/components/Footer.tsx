import { Link } from "react-router-dom";
import { Instagram, Linkedin } from "lucide-react";
import { FOOTER, SOCIAL_LINKS, BRAND } from "@/constants/content";
import { GetHelpButton } from "@/components/support/GetHelpButton";
import logo from "@/assets/oc-icon.png";

export function Footer() {
  return (
    <footer className="bg-foreground text-background relative">
      {/* Gradient top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <img src={logo} alt="OpenClique" className="w-8 h-8 rounded-lg opacity-80" />
              <h3 className="font-display text-xl font-bold">{BRAND.name}</h3>
            </div>
            <p className="text-background/60 text-sm max-w-md leading-relaxed">
              {BRAND.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm tracking-wide uppercase text-background/80">Links</h4>
            <ul className="space-y-2.5">
              {FOOTER.links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/how-it-works#faq"
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm tracking-wide uppercase text-background/80">Connect</h4>
            <a
              href={`mailto:${FOOTER.contactEmail}`}
              className="text-sm text-background/60 hover:text-background transition-colors block mb-3"
            >
              {FOOTER.contactEmail}
            </a>
            <GetHelpButton variant="link" className="text-background/60 hover:text-background mb-4" />
            <div className="flex gap-4 mt-2">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/50 hover:text-background transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/50 hover:text-background transition-colors"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-background/10 mt-10 pt-8">
          <p className="text-sm text-background/40 text-center">
            {FOOTER.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
