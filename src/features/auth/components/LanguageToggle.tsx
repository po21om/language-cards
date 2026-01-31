import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { LanguagePreference } from "@/types";

export function LanguageToggle() {
  const [language, setLanguage] = useState<LanguagePreference>("en");

  const toggleLanguage = () => {
    const newLanguage: LanguagePreference = language === "en" ? "pl" : "en";
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      aria-label={language === "en" ? "Switch to Polish" : "Switch to English"}
    >
      {language === "en" ? "EN" : "PL"}
    </Button>
  );
}
