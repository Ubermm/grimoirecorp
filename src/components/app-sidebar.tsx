'use client';

import { useState } from 'react';
import { User } from 'next-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarFooter, SidebarMenuButton } from '@/components/ui/sidebar';
import Image from 'next/image';
import { 
  Home, 
  Grid3x3, 
  Building2, 
  BookOpen, 
  PlayCircle, 
  LogOut, 
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home
    },
    {
      name: 'Catalogue',
      href: '/models',
      icon: Grid3x3
    },
    {
      name: 'Organization',
      href: '/org',
      icon: Building2
    },
    {
      name: 'Notebooks',
      href: '/pod',
      icon: BookOpen
    },
    {
      name: 'Runs',
      href: '/runs',
      icon: PlayCircle
    }
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <Sidebar className="border-r">
      <div className="flex flex-col h-full">
        <div className="px-3 py-4">
          <Link href="/" className="flex items-center px-3 mb-6">
            <span className="font-bold text-lg">FDA Compliance Tool</span>
          </Link>

          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-muted"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-auto">
          <SidebarFooter>
            <div className="flex items-center justify-between w-full px-3 py-2">
              <Button 
                variant="ghost" 
                className="flex items-center justify-between w-full p-2" 
                onClick={toggleMenu}
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    <Image
                      src={`https://avatar.vercel.sh/${user.email}`}
                      alt={user.email ?? 'User Avatar'}
                      width={32}
                      height={32}
                      className="rounded-full h-8 w-8"
                    />
                  </div>
                  <span className="ml-2 text-sm font-medium truncate max-w-32">
                    {user?.name || user?.email}
                  </span>
                </div>
                {isMenuOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
              
              {isMenuOpen && (
                <div className="absolute bottom-14 left-0 right-0 bg-background border border-border rounded-md shadow-md p-2 mx-2">
                  <Link href="/settings">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </Link>
                  <Link href="/logout">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </SidebarFooter>
        </div>
      </div>
    </Sidebar>
  );
}