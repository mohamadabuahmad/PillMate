import { Stack } from "expo-router";
import { AccessibilityProvider } from "../contexts/AccessibilityContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ThemeProvider } from "../contexts/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AccessibilityProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AccessibilityProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}