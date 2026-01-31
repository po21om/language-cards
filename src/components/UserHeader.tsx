import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";

interface UserHeaderProps {
  userEmail: string;
}

export function UserHeader({ userEmail }: UserHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/v1/auth/signout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        window.location.href = "/auth";
      } else {
        console.error("Logout failed");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {userEmail}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        disabled={isLoggingOut}
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4 mr-2" />
        {isLoggingOut ? "Signing out..." : "Sign out"}
      </Button>
    </div>
  );
}
