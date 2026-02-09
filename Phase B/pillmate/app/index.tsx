/**
 * Root Index Component
 * 
 * This is the entry point of the app. It immediately redirects users
 * to the splash screen, which handles authentication state checking
 * and navigation to the appropriate screen.
 */
import { Redirect } from "expo-router";

export default function Index() {
  // Redirect to splash screen on app launch
  return <Redirect href={"/splash" as any} />;
}