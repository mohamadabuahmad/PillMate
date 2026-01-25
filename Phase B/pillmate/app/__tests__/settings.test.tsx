import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { signOut } from "firebase/auth";
import { router } from "expo-router";
import { Alert } from "react-native";
import SettingsTab from "../(tabs)/settings";
import { auth } from "../../src/firebase";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";

// Get mocked functions from jest.setup.js
const mockSetLanguage = jest.fn();
const mockSetTheme = jest.fn();

// Override mocks for this test file
jest.mock("../../contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: "en",
    setLanguage: mockSetLanguage,
  }),
}));

jest.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: mockSetTheme,
    isDark: false,
  }),
}));

const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockRouterReplace = router.replace as jest.MockedFunction<typeof router.replace>;

describe("Settings Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render settings screen", () => {
    const { getByText } = render(<SettingsTab />);

    expect(getByText(/settings/i)).toBeTruthy();
    expect(getByText(/language/i)).toBeTruthy();
    expect(getByText(/theme/i)).toBeTruthy();
  });

  it("should display language options", () => {
    const { getByText } = render(<SettingsTab />);

    expect(getByText("English")).toBeTruthy();
    expect(getByText("العربية")).toBeTruthy();
    expect(getByText("עברית")).toBeTruthy();
  });

  it("should display theme options", () => {
    const { getByText } = render(<SettingsTab />);

    expect(getByText(/light/i)).toBeTruthy();
    expect(getByText(/dark/i)).toBeTruthy();
    expect(getByText(/auto/i)).toBeTruthy();
  });

  it("should change language when option is selected", () => {
    const { getByText } = render(<SettingsTab />);

    const arabicOption = getByText("العربية");
    fireEvent.press(arabicOption);

    expect(mockSetLanguage).toHaveBeenCalledWith("ar");
  });

  it("should change theme when option is selected", () => {
    const { getByText } = render(<SettingsTab />);

    const darkThemeOption = getByText(/dark/i);
    fireEvent.press(darkThemeOption);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("should show logout confirmation alert", () => {
    const { getByText } = render(<SettingsTab />);

    const logoutButton = getByText("Logout");
    fireEvent.press(logoutButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Logout",
      "Are you sure you want to logout?",
      expect.any(Array)
    );
  });

  it("should logout when confirmed", async () => {
    mockSignOut.mockResolvedValue(undefined);

    const { getByText } = render(<SettingsTab />);

    const logoutButton = getByText("Logout");
    fireEvent.press(logoutButton);

    // Simulate alert confirmation
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0][2];
    const confirmButton = alertCall.find((btn: any) => btn.text === "Logout");
    confirmButton.onPress();

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith(auth);
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/(auth)/sign-in");
    });
  });

  it("should not logout when cancelled", async () => {
    const { getByText } = render(<SettingsTab />);

    const logoutButton = getByText("Logout");
    fireEvent.press(logoutButton);

    // Verify alert was shown with Cancel button
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0][2];
    const cancelButton = alertCall.find((btn: any) => btn.text === "Cancel");
    expect(cancelButton).toBeDefined();
    expect(cancelButton.style).toBe("cancel");

    // Cancel button just dismisses the alert, so signOut should not be called
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("should handle logout error", async () => {
    mockSignOut.mockRejectedValue(new Error("Logout failed"));

    const { getByText } = render(<SettingsTab />);

    const logoutButton = getByText("Logout");
    fireEvent.press(logoutButton);

    // Simulate alert confirmation
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0][2];
    const confirmButton = alertCall.find((btn: any) => btn.text === "Logout");
    confirmButton.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", expect.any(String));
    });
  });
});
