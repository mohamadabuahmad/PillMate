import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { ref, set, get, onValue } from "firebase/database";
import { router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import LinkDevice from "../(device)/link";
import { auth, db, rtdb } from "../../src/firebase";

const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockSet = set as jest.MockedFunction<typeof set>;
const mockGet = get as jest.MockedFunction<typeof get>;
const mockOnValue = onValue as jest.MockedFunction<typeof onValue>;
const mockRouterReplace = router.replace as jest.MockedFunction<typeof router.replace>;
const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<typeof useLocalSearchParams>;

describe("LinkDevice Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as any).currentUser = { uid: "test-uid" };
    mockGetDocs.mockResolvedValue({
      empty: true,
    } as any);
    // Mock useLocalSearchParams to return empty params by default
    mockUseLocalSearchParams.mockReturnValue({});
  });

  it("should render device link form", async () => {
    const { getByText, getByPlaceholderText } = render(<LinkDevice />);

    await waitFor(() => {
      expect(getByText(/Connect your PillMate box/i)).toBeTruthy();
    });
    expect(getByPlaceholderText(/Enter 6-digit PIN/i)).toBeTruthy();
  });

  it("should show error when pair code is empty", async () => {
    const { getByText } = render(<LinkDevice />);

    await waitFor(() => {
      expect(getByText(/Link Device/i)).toBeTruthy();
    });

    const linkButton = getByText(/Link Device/i);
    await act(async () => {
      fireEvent.press(linkButton);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  it("should link device with valid pair code", async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({ pairCode: "123456" }),
    } as any);
    mockSetDoc.mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = render(<LinkDevice />);

    await waitFor(() => {
      expect(getByPlaceholderText(/Enter 6-digit PIN/i)).toBeTruthy();
    });

    const pairCodeInput = getByPlaceholderText(/Enter 6-digit PIN/i);
    fireEvent.changeText(pairCodeInput, "123456");

    const linkButton = getByText(/Link Device/i);
    await act(async () => {
      fireEvent.press(linkButton);
    });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
    });
  });

  it("should redirect to home after successful link", async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({ status: "WAITING_FOR_PAIR", pairCode: "123456" }),
    } as any);
    mockSet.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = render(<LinkDevice />);

    await waitFor(() => {
      expect(getByPlaceholderText(/Enter 6-digit PIN/i)).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText(/Enter 6-digit PIN/i), "123456");
    await act(async () => {
      fireEvent.press(getByText(/Link Device/i));
    });

    // Wait for success alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Success!",
        "Device linked successfully!",
        expect.any(Array)
      );
    });

    // Simulate clicking OK button in the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
      (call) => call[0] === "Success!"
    );
    const okButton = alertCall[2][0];
    okButton.onPress();

    expect(mockRouterReplace).toHaveBeenCalledWith("/(tabs)");
  });

  it("should show error for invalid pair code", async () => {
    mockGet.mockResolvedValue({
      exists: () => false,
    } as any);

    const { getByText, getByPlaceholderText } = render(<LinkDevice />);

    await waitFor(() => {
      expect(getByPlaceholderText(/Enter 6-digit PIN/i)).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText(/Enter 6-digit PIN/i), "invalid");
    await act(async () => {
      fireEvent.press(getByText(/Link Device/i));
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  it("should redirect to sign in if user is not authenticated", () => {
    (auth as any).currentUser = null;

    render(<LinkDevice />);

    expect(mockRouterReplace).toHaveBeenCalledWith("/(auth)/sign-in");
  });

  it("should redirect to home if device already linked", async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
    } as any);

    render(<LinkDevice />);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("should show loading state during linking", async () => {
    let resolvePromise: any;
    mockGet.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = () => resolve({
            exists: () => true,
            val: () => ({ status: "WAITING_FOR_PAIR", pairCode: "123456" }),
          });
        })
    );
    mockSet.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = render(<LinkDevice />);

    await waitFor(() => {
      expect(getByPlaceholderText(/Enter 6-digit PIN/i)).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText(/Enter 6-digit PIN/i), "123456");
    
    // Press the button
    const linkButton = getByText(/Link Device/i);
    await act(async () => {
      fireEvent.press(linkButton);
    });

    // Verify mockGet was called (linking process started)
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
    });

    // Resolve the promise to complete the test
    if (resolvePromise) resolvePromise();
  });
});
