/**
 * Root Layout Component
 * 
 * This is the root layout for the entire app. It wraps all screens with
 * necessary context providers for theming, language, and accessibility.
 * The providers are nested to ensure proper access to all contexts throughout the app.
 */
import { Stack } from "expo-router";
import { AccessibilityProvider } from "../contexts/AccessibilityContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ThemeProvider } from "../contexts/ThemeContext";

export default function RootLayout() {
  return (
    // Theme provider wraps everything to provide theme context
    <ThemeProvider>
      {/* Language provider for internationalization support */}
      <LanguageProvider>
        {/* Accessibility provider for text size, contrast, and simplified mode */}
        <AccessibilityProvider>
          {/* Stack navigator with hidden headers for custom navigation */}
          <Stack screenOptions={{ headerShown: false }} />
        </AccessibilityProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}