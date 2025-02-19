//@ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Bell, Home, Book, ChevronDown } from "lucide-react";
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

const NavLink = ({ href, label, description, icon }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative group">
      <Link 
        href={href}
        className={`
          relative px-4 py-2 rounded-full transition-all duration-500
          flex items-center gap-2 group-hover:bg-white/10
          ${isActive ? 'text-black' : 'text-white/90 hover:text-white'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {icon && <span className="transition-transform duration-300 group-hover:scale-110">{icon}</span>}
        <span className="relative z-10 text-sm font-medium">{label}</span>
        {isActive && (
          <div className="absolute inset-0 bg-white/90 rounded-full transition-all duration-500 backdrop-blur-sm" />
        )}
      </Link>
      
      {isHovered && description && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 bg-black/95 border border-white/20 rounded-lg w-48 shadow-xl transition-all duration-300 backdrop-blur-md z-50">
          <p className="text-xs text-white/80 text-center">{description}</p>
        </div>
      )}
    </div>
  );
};

const DocsDropdown = () => {
  const docPages = [
    { href: '/docs/ai-best-practices', label: 'AI Best Practices', description: 'Guidelines for AI implementation' },
    { href: '/docs/similar-violations', label: 'Letter Similarity Search', description: 'Find Similar Warning Letters for Cross-reference' },
    { href: '/docs/letter-comparison', label: 'Letter Comparison', description: 'Compare document similarities' },
    { href: '/docs/overview', label: 'Overview', description: 'System architecture overview' },
    { href: '/docs/prolog-validation', label: 'Prolog Validation', description: 'Logic validation tools' },
    { href: '/docs/quickstart', label: 'Quickstart', description: 'Get started quickly' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 text-white/90 hover:text-white px-4 py-2 rounded-full transition-all duration-300 hover:bg-white/10">
          <Book className="w-4 h-4" />
          <span className="text-sm font-medium">Docs</span>
          <ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-black/95 border border-white/20 w-64 backdrop-blur-md mt-2">
        {docPages.map((page) => (
          <DropdownMenuItem key={page.href} className="focus:bg-white/10">
            <Link href={page.href} className="flex flex-col py-2 px-4 w-full">
              <span className="font-medium text-sm text-white/90">{page.label}</span>
              <span className="text-xs text-white/60">{page.description}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AuthButton = () => {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: false,
    onUnauthenticated() {
      // Handle unauthenticated state
    },
  });

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };
  const STORAGE_KEY = 'app_auth_state';
  const handleSignOut = async () => {
    localStorage.setItem(STORAGE_KEY, 'false');
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  if (status === 'loading') {
    return <Button variant="ghost" className="text-white/80 text-sm">Loading...</Button>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          className="text-white hover:text-black text-sm bg-black rounded-full hover:bg-white hover:text-black"
          onClick={handleLogin}
        >
          Login
        </Button>
        <Button 
          variant="ghost"
          className="text-black hover:text-white text-sm bg-white rounded-full hover:bg-black"
          onClick={handleRegister}
        >
          Sign up
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 rounded-full hover:bg-white/10">
          <Image
            src={`/logoo.png`}
            alt={session.user.email ?? 'User Avatar'}
            width={36}
            height={36}
            className="rounded-full transition-transform duration-300 hover:scale-105"
          />
          <span className="hidden md:inline text-sm text-white/90">{session.user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-black/95 border border-white/20 backdrop-blur-md">
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer hover:bg-white/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="text-sm">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Home', description: 'Return to homepage' },
    { href: '/about', label: 'About', description: 'Learn about our company' },
    { href: '/audit', label: 'Audits', description: 'View your Audit Flows' },
    { href: '/analytics', label: 'Analytics', description: 'Warning Letter Analysis' },
    { href: '/contact', label: 'Contact', description: 'Get in touch with us' },
  ];

  return (
    <>
      <nav className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-500
        ${scrolled ? 'bg-black/70 backdrop-blur-md' : 'bg-transparent'}
        border-b border-white/10
      `}>
        <div className="container mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="my-font font-bold ">
              Grimoire
            </Link>
 
            <div className="hidden md:flex items-center space-x-1 bg-gray-700/40 p-2 rounded-full backdrop-blur-sm">
            <AuthButton />
              {navLinks.map((link) => (
                <NavLink key={link.href} {...link} />
              ))}
              <DocsDropdown />
            </div>

            <button 
              className="md:hidden text-white/90 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <div 
          className={`
            fixed top-0 right-0 h-screen w-[280px]
            bg-black/95 backdrop-blur-md
            transform transition-all duration-500 ease-in-out
            border-l border-white/10 shadow-2xl
            pt-16 // Added padding to account for navbar height
            ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
            md:hidden
          `}
        >
          {/* Close button for mobile drawer */}
          <button 
            className="absolute top-4 right-4 text-white/90 hover:text-white p-2 rounded-full hover:bg-white/10"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col p-4 space-y-2 h-full overflow-y-auto">

            {/* Navigation Links */}
            <div className="space-y-1">
              {/* Auth Button Section */}
            <div className="mt-auto pt-4 border-t border-white/10 ">
              <div className="px-4">
                <AuthButton />
              </div>
            </div>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-300
                    ${pathname === link.href 
                      ? 'bg-white text-black font-medium' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                    }
                  `}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Docs Section in Mobile */}
            <div className="py-2 px-4 border-t border-white/10 mt-4">
              <span className="text-sm font-medium text-white/60 uppercase tracking-wider">
                Documentation
              </span>
              {[
                'AI Best Practices',
                'Letter Comparison',
                'Overview',
                'Prolog Validation',
                'Quickstart',
                'Similar Violations'
              ].map((item) => (
                <Link
                  key={item}
                  href={`/docs/${item.toLowerCase().replaceAll(' ', '-')}`}
                  className="block px-4 py-2 mt-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
            </div>

          </div>
        </div>
      </nav>
      
      {/* Overlay for mobile drawer */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      
      <div className="h-[60px]" />
    </>
  );
};