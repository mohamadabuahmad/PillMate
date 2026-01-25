import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { router } from "expo-router";
import { Alert } from "react-native";
import SignUp from "../(auth)/sign-up";
import { auth, db } from "../../src/firebase";

const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.MockedFunction<
  typeof createUserWithEmailAndPassword
>;
const mockUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockRouterReplace = router.replace as jest.MockedFunction<typeof router.replace>;

describe("SignUp Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as any).currentUser = null;
  });

  it("should render sign up form", () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    expect(getByText("Create Account")).toBeTruthy();
    expect(getByPlaceholderText("Enter your first name")).toBeTruthy();
    expect(getByPlaceholderText("Enter your last name")).toBeTruthy();
    expect(getByPlaceholderText("Enter your phone number")).toBeTruthy();
    expect(getByPlaceholderText("Enter your email")).toBeTruthy();
    expect(getByPlaceholderText("Create a password")).toBeTruthy();
    expect(getByPlaceholderText("Confirm your password")).toBeTruthy();
    expect(getByText("Sign Up")).toBeTruthy();
  });

  it("should validate first name - required", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const firstNameInput = getByPlaceholderText("Enter your first name");
    fireEvent(firstNameInput, "blur");

    await waitFor(() => {
      expect(getByText(/First name is required/i)).toBeTruthy();
    });
  });

  it("should validate first name - minimum length", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const firstNameInput = getByPlaceholderText("Enter your first name");
    fireEvent.changeText(firstNameInput, "A");
    fireEvent(firstNameInput, "blur");

    await waitFor(() => {
      expect(getByText(/First name must be at least 2 characters/i)).toBeTruthy();
    });
  });

  it("should validate first name - invalid characters", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const firstNameInput = getByPlaceholderText("Enter your first name");
    fireEvent.changeText(firstNameInput, "John123");
    fireEvent(firstNameInput, "blur");

    await waitFor(() => {
      expect(getByText(/First name can only contain letters/i)).toBeTruthy();
    });
  });

  it("should validate last name", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const lastNameInput = getByPlaceholderText("Enter your last name");
    fireEvent.changeText(lastNameInput, "");
    fireEvent(lastNameInput, "blur");

    await waitFor(() => {
      expect(getByText(/Last name is required/i)).toBeTruthy();
    });
  });

  it("should validate phone number - minimum digits", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const phoneInput = getByPlaceholderText("Enter your phone number");
    fireEvent.changeText(phoneInput, "123");
    fireEvent(phoneInput, "blur");

    await waitFor(() => {
      expect(getByText(/Phone number must be at least 10 digits/i)).toBeTruthy();
    });
  });

  it("should validate email format", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const emailInput = getByPlaceholderText("Enter your email");
    fireEvent.changeText(emailInput, "invalid-email");
    fireEvent(emailInput, "blur");

    await waitFor(() => {
      expect(getByText(/Please enter a valid email address/i)).toBeTruthy();
    });
  });

  it("should validate password strength - minimum length", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const passwordInput = getByPlaceholderText("Create a password");
    fireEvent.changeText(passwordInput, "weak");
    fireEvent(passwordInput, "blur");

    await waitFor(() => {
      expect(
        getByText(/Password must be at least 6 characters/i) ||
          getByText(/Password should contain at least one uppercase letter/i)
      ).toBeTruthy();
    });
  });

  it("should validate password strength - uppercase required", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const passwordInput = getByPlaceholderText("Create a password");
    fireEvent.changeText(passwordInput, "lowercase123");
    fireEvent(passwordInput, "blur");

    await waitFor(() => {
      expect(getByText(/Password should contain at least one uppercase letter/i)).toBeTruthy();
    });
  });

  it("should validate password strength - lowercase required", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const passwordInput = getByPlaceholderText("Create a password");
    fireEvent.changeText(passwordInput, "UPPERCASE123");
    fireEvent(passwordInput, "blur");

    await waitFor(() => {
      expect(getByText(/Password should contain at least one lowercase letter/i)).toBeTruthy();
    });
  });

  it("should validate password strength - number required", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const passwordInput = getByPlaceholderText("Create a password");
    fireEvent.changeText(passwordInput, "NoNumbers");
    fireEvent(passwordInput, "blur");

    await waitFor(() => {
      expect(getByText(/Password should contain at least one number/i)).toBeTruthy();
    });
  });

  it("should validate password match", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const passwordInput = getByPlaceholderText("Create a password");
    const confirmPasswordInput = getByPlaceholderText("Confirm your password");

    fireEvent.changeText(passwordInput, "Password123");
    fireEvent.changeText(confirmPasswordInput, "Password456");
    fireEvent(confirmPasswordInput, "blur");

    await waitFor(() => {
      expect(getByText(/Passwords do not match/i)).toBeTruthy();
    });
  });

  it("should show success hint when password is valid", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const passwordInput = getByPlaceholderText("Create a password");
    fireEvent.changeText(passwordInput, "Password123");
    fireEvent(passwordInput, "blur");

    await waitFor(() => {
      expect(getByText(/Password meets requirements/i)).toBeTruthy();
    });
  });

  it("should create user account with valid data", async () => {
    const mockUser = {
      uid: "test-uid",
      email: "test@example.com",
    };
    mockCreateUserWithEmailAndPassword.mockResolvedValue({
      user: mockUser,
    } as any);
    mockUpdateProfile.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = render(<SignUp />);

    fireEvent.changeText(getByPlaceholderText("Enter your first name"), "John");
    fireEvent.changeText(getByPlaceholderText("Enter your last name"), "Doe");
    fireEvent.changeText(getByPlaceholderText("Enter your phone number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Enter your email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Create a password"), "Password123");
    fireEvent.changeText(getByPlaceholderText("Confirm your password"), "Password123");

    const signUpButton = getByText("Sign Up");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "test@example.com",
        "Password123"
      );
    });

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: "John Doe",
      });
    });

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/(auth)/allergy-form");
    });
  });

  it("should show error for email already in use", async () => {
    mockCreateUserWithEmailAndPassword.mockRejectedValue({
      code: "auth/email-already-in-use",
    });

    const { getByText, getByPlaceholderText } = render(<SignUp />);

    // Fill form with valid data
    fireEvent.changeText(getByPlaceholderText("Enter your first name"), "John");
    fireEvent.changeText(getByPlaceholderText("Enter your last name"), "Doe");
    fireEvent.changeText(getByPlaceholderText("Enter your phone number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Enter your email"), "existing@example.com");
    fireEvent.changeText(getByPlaceholderText("Create a password"), "Password123");
    fireEvent.changeText(getByPlaceholderText("Confirm your password"), "Password123");

    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(getByText(/This email is already in use/i)).toBeTruthy();
    });
  });

  it("should disable sign up button when form has errors", async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);

    const signUpButton = getByText("Sign Up");

    // Fill with invalid data
    fireEvent.changeText(getByPlaceholderText("Enter your first name"), "A");
    fireEvent.changeText(getByPlaceholderText("Enter your last name"), "B");
    fireEvent.changeText(getByPlaceholderText("Enter your phone number"), "123");
    fireEvent.changeText(getByPlaceholderText("Enter your email"), "invalid");
    fireEvent.changeText(getByPlaceholderText("Create a password"), "weak");
    fireEvent.changeText(getByPlaceholderText("Confirm your password"), "different");

    // Trigger validation by pressing button
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(signUpButton).toBeDisabled();
    });
  });

  it("should show loading state during sign up", async () => {
    mockCreateUserWithEmailAndPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ user: { uid: "test" } } as any), 100);
        })
    );

    const { getByText, getByPlaceholderText } = render(<SignUp />);

    // Fill form with valid data
    fireEvent.changeText(getByPlaceholderText("Enter your first name"), "John");
    fireEvent.changeText(getByPlaceholderText("Enter your last name"), "Doe");
    fireEvent.changeText(getByPlaceholderText("Enter your phone number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Enter your email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Create a password"), "Password123");
    fireEvent.changeText(getByPlaceholderText("Confirm your password"), "Password123");

    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(getByText(/Creating Account/i)).toBeTruthy();
    });
  });

  it("should trim all input fields before submission", async () => {
    const mockUser = { uid: "test-uid" };
    mockCreateUserWithEmailAndPassword.mockResolvedValue({
      user: mockUser,
    } as any);
    mockUpdateProfile.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = render(<SignUp />);

    fireEvent.changeText(getByPlaceholderText("Enter your first name"), "  John  ");
    fireEvent.changeText(getByPlaceholderText("Enter your last name"), "  Doe  ");
    fireEvent.changeText(getByPlaceholderText("Enter your phone number"), "  1234567890  ");
    fireEvent.changeText(getByPlaceholderText("Enter your email"), "  test@example.com  ");
    fireEvent.changeText(getByPlaceholderText("Create a password"), "Password123");
    fireEvent.changeText(getByPlaceholderText("Confirm your password"), "Password123");

    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "test@example.com",
        "Password123"
      );
    });

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: "John Doe",
      });
    });
  });
});
