import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { updateProfile, updateEmail } from "firebase/auth";
import { router } from "expo-router";
import { Alert } from "react-native";
import ProfileTab from "../(tabs)/profile";
import { auth } from "../../src/firebase";

const mockUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;
const mockUpdateEmail = updateEmail as jest.MockedFunction<typeof updateEmail>;
const mockRouterPush = router.push as jest.MockedFunction<typeof router.push>;

describe("Profile Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as any).currentUser = {
      uid: "test-uid",
      displayName: "John Doe",
      email: "john@example.com",
    };
  });

  it("should render profile form", () => {
    const { getByText, getByDisplayValue } = render(<ProfileTab />);

    expect(getByText(/Edit Profile/i)).toBeTruthy();
    expect(getByDisplayValue("John Doe")).toBeTruthy();
    expect(getByDisplayValue("john@example.com")).toBeTruthy();
  });

  it("should update display name", async () => {
    mockUpdateProfile.mockResolvedValue(undefined);

    const { getByText, getByDisplayValue } = render(<ProfileTab />);

    const nameInput = getByDisplayValue("John Doe");
    fireEvent.changeText(nameInput, "Jane Doe");

    const saveButton = getByText(/save/i);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        auth.currentUser,
        { displayName: "Jane Doe" }
      );
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Success", "Profile updated successfully");
    });
  });

  it("should update email", async () => {
    mockUpdateEmail.mockResolvedValue(undefined);

    const { getByText, getByDisplayValue } = render(<ProfileTab />);

    const emailInput = getByDisplayValue("john@example.com");
    fireEvent.changeText(emailInput, "jane@example.com");

    const saveButton = getByText(/save/i);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockUpdateEmail).toHaveBeenCalledWith(
        auth.currentUser,
        "jane@example.com"
      );
    });
  });

  it("should not update email if unchanged", async () => {
    mockUpdateProfile.mockResolvedValue(undefined);

    const { getByText, getByDisplayValue } = render(<ProfileTab />);

    const nameInput = getByDisplayValue("John Doe");
    fireEvent.changeText(nameInput, "John Smith");

    const saveButton = getByText(/save/i);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockUpdateEmail).not.toHaveBeenCalled();
    });
  });

  it("should navigate to change password screen", () => {
    const { getByText } = render(<ProfileTab />);

    const changePasswordButton = getByText(/Change Password/i);
    fireEvent.press(changePasswordButton);

    expect(mockRouterPush).toHaveBeenCalledWith("/change-password");
  });

  it("should handle update errors", async () => {
    mockUpdateProfile.mockRejectedValue(new Error("Update failed"));

    const { getByText, getByDisplayValue } = render(<ProfileTab />);

    const nameInput = getByDisplayValue("John Doe");
    fireEvent.changeText(nameInput, "Jane Doe");

    const saveButton = getByText(/save/i);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", expect.any(String));
    });
  });

  it("should show loading state during save", async () => {
    mockUpdateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 100);
        })
    );

    const { getByText, getByDisplayValue } = render(<ProfileTab />);

    const nameInput = getByDisplayValue("John Doe");
    fireEvent.changeText(nameInput, "Jane Doe");

    const saveButton = getByText(/save/i);
    fireEvent.press(saveButton);

    // Button should be disabled during save
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });

  it("should trim name and email before saving", async () => {
    mockUpdateProfile.mockResolvedValue(undefined);
    mockUpdateEmail.mockResolvedValue(undefined);

    const { getByText, getByDisplayValue } = render(<ProfileTab />);

    const nameInput = getByDisplayValue("John Doe");
    const emailInput = getByDisplayValue("john@example.com");

    fireEvent.changeText(nameInput, "  Jane Doe  ");
    fireEvent.changeText(emailInput, "  jane@example.com  ");

    const saveButton = getByText(/save/i);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        auth.currentUser,
        { displayName: "Jane Doe" }
      );
    });

    await waitFor(() => {
      expect(mockUpdateEmail).toHaveBeenCalledWith(
        auth.currentUser,
        "jane@example.com"
      );
    });
  });
});
