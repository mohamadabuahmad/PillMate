import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { router } from "expo-router";
import SignIn from "../(auth)/sign-in";
import { auth, db } from "../../src/firebase";

const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.MockedFunction<
  typeof signInWithEmailAndPassword
>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockRouterReplace = router.replace as jest.MockedFunction<typeof router.replace>;

describe("SignIn Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as any).currentUser = null;
  });

  it("should render sign in form", () => {
    const { getByText, getByPlaceholderText } = render(<SignIn />);

    expect(getByText("PillMate")).toBeTruthy();
    expect(getByText("Welcome back")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByText("Sign In")).toBeTruthy();
  });

  it("should show error when email is empty", async () => {
    const { getByText, getByPlaceholderText } = render(<SignIn />);

    const passwordInput = getByPlaceholderText("Password");
    fireEvent.changeText(passwordInput, "password123");

    const signInButton = getByText("Sign In");
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(getByText(/Please enter your email address/i)).toBeTruthy();
    });
  });

  it("should show error when password is empty", async () => {
    const { getByText, getByPlaceholderText } = render(<SignIn />);

    const emailInput = getByPlaceholderText("Email");
    fireEvent.changeText(emailInput, "test@example.com");

    const signInButton = getByText("Sign In");
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(getByText(/Please enter your password/i)).toBeTruthy();
    });
  });

  it("should call signInWithEmailAndPassword with correct credentials", async () => {
    const mockUser = { uid: "test-uid" };
    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: mockUser,
    } as any);

    mockGetDocs.mockResolvedValue({
      empty: true,
    } as any);

    const { getByText, getByPlaceholderText } = render(<SignIn />);

    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");

    const signInButton = getByText("Sign In");
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "test@example.com",
        "password123"
      );
    });
  });

  it("should redirect to device link when user has no device", async () => {
    const mockUser = { uid: "test-uid" };
    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: mockUser,
    } as any);

    mockGetDocs.mockResolvedValue({
      empty: true,
    } as any);

    const { getByText, getByPlaceholderText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/(device)/link");
    });
  });

  it("should redirect to tabs when user has device", async () => {
    const mockUser = { uid: "test-uid" };
    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: mockUser,
    } as any);

    mockGetDocs.mockResolvedValue({
      empty: false,
    } as any);

    const { getByText, getByPlaceholderText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("should show error message for invalid email", async () => {
    mockSignInWithEmailAndPassword.mockRejectedValue({
      code: "auth/invalid-email",
    });

    const { getByText, getByPlaceholderText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Email"), "invalid-email");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(getByText(/Invalid email address format/i)).toBeTruthy();
    });
  });

  it("should show error message for wrong password", async () => {
    mockSignInWithEmailAndPassword.mockRejectedValue({
      code: "auth/wrong-password",
    });

    const { getByText, getByPlaceholderText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "wrongpassword");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(getByText(/Incorrect password/i)).toBeTruthy();
    });
  });

  it("should show error message for user not found", async () => {
    mockSignInWithEmailAndPassword.mockRejectedValue({
      code: "auth/user-not-found",
    });

    const { getByText, getByPlaceholderText } = render(<SignIn />);

    fireEvent.changeText(getByPlaceholderText("Email"), "notfound@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(getByText(/No account found/i)).toBeTruthy();
    });
  });

  it("should clear error message when user types", async () => {
    mockSignInWithEmailAndPassword.mockRejectedValue({
      code: "auth/invalid-email",
    });

    const { getByText, getByPlaceholderText, queryByText } = render(<SignIn />);

    const emailInput = getByPlaceholderText("Email");
    fireEvent.changeText(emailInput, "invalid");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(getByText(/Invalid email address format/i)).toBeTruthy();
    });

    // Clear error by typing
    fireEvent.changeText(emailInput, "new@email.com");

    await waitFor(() => {
      expect(queryByText(/Invalid email address format/i)).toBeNull();
    });
  });

  it("should trim email before submission", async () => {
    const mockUser = { uid: "test-uid" };
    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: mockUser,
    } as any);

    mockGetDocs.mockResolvedValue({
      empty: true,
    } as any);

    const { getByText, getByPlaceholderText } = render(<SignIn />);

    const emailInput = getByPlaceholderText("Email");
    fireEvent.changeText(emailInput, "  test@example.com  ");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "test@example.com",
        "password123"
      );
    });
  });
});
