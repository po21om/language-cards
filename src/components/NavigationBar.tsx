import { Home, Sparkles, BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationBarProps {
  currentPath?: string;
}

export function NavigationBar({ currentPath = '' }: NavigationBarProps) {
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/generate', label: 'Generate', icon: Sparkles },
    { href: '/study', label: 'Study', icon: BookOpen },
    { href: '/trash', label: 'Trash', icon: Trash2 },
  ];

  const handleNavigate = (href: string) => {
    window.location.href = href;
  };

  return (
    <nav className="border-b bg-background" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto">
        <div className="flex h-16 items-center gap-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;

            return (
              <Button
                key={item.href}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleNavigate(item.href)}
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
      </div>
    </nav>
  );
}
