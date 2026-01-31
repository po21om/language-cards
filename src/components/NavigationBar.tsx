import { useState } from 'react';
import { Home, Sparkles, BookOpen, Trash2, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NavigationBarProps {
  currentPath?: string;
  userEmail: string;
}

export function NavigationBar({ currentPath = '', userEmail }: NavigationBarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/generate', label: 'Generate', icon: Sparkles },
    { href: '/study', label: 'Study', icon: BookOpen },
    { href: '/trash', label: 'Trash', icon: Trash2 },
  ];

  const handleNavigate = (href: string) => {
    if (currentPath !== href) {
      window.location.href = href;
    }
  };

  const handleSettingsClick = () => {
    if (currentPath !== '/settings') {
      window.location.href = '/settings';
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch('/api/v1/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.href = '/auth';
      } else {
        console.error('Logout failed');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="border-b bg-background" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;

              return (
                <Button
                  key={item.href}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleNavigate(item.href)}
                  disabled={isActive}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{userEmail}</span>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSettingsClick}
              disabled={currentPath === '/settings'}
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
