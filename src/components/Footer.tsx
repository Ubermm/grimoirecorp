// components/Footer.tsx
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="border-t border-white/10 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Grimoire.corp</h3>
            <p className="text-white/60 text-sm">
              Ensuring compliance through mathematical verification.
            </p>
          </div>
          {[
            {
              title: "Solutions",
              links: [
                { href: "/docs/overview", label: "Technical Framework" },
                { href: "/audit", label: "Audit Dashboard" },
                { href: "/analytics", label: "Letter Analytics" }

              ]
            },
            {
              title: "Company",
              links: [
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" }
              ]
            },
            {
              title: "Legal",
              links: [
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" }
              ]
            }
          ].map((section, index) => (
            <div key={index} className="space-y-4">
              <h4 className="text-white font-semibold">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link href={link.href} className="text-white/60 hover:text-white text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 text-center text-white/60 text-sm">
          <p>© {new Date().getFullYear()} Grimoire.Corp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};