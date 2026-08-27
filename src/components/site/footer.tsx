import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, ShieldAlert } from "lucide-react";

import { GAME_NAME } from "@/game/game-meta";

const FOOTER_LINKS = [
  { to: "/terms", label: "Terms of Service" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/refund", label: "Refund Policy" },
  { to: "/contact", label: "Contact Us" },
  { to: "/purchases", label: "مشترياتي" },
];

const BRAND_NAME = "ورا السالفة | Wara Al Salfa";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg file-tape">
              <ShieldAlert className="size-4" />
            </span>
            <span className="font-display text-sm font-bold">{GAME_NAME}</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a
              href="mailto:contact@waralsalfa.com"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="size-4" />
              contact@waralsalfa.com
            </a>
            <a
              href="https://wa.me/+96551270774"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageCircle className="size-4" />
              @waralsalfa
            </a>
          </div>
        </div>

        <div className="mt-6 border-t border-border/40 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {BRAND_NAME}. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
