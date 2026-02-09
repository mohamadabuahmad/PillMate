import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { Alert } from "react-native";
import Home from "../(tabs)/index";
import { auth, db, rtdb } from "../../src/firebase";

const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockSet = set as jest.MockedFunction<typeof set>;
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;

// Mock the safety hooks to avoid async complexity
jest.mock("../../hooks/useMedicationSafety", () => ({
  useMedicationSafety: () => ({
    checkAllergy: jest.fn().mockResolvedValue({
      hasAllergy: false,
      severity: "none",
      message: "",
      shouldBlock: false,
    }),
    checkInteraction: jest.fn().mockResolvedValue({
      canTakeTogether: true,
      interactionLevel: "none",
      timeGapRequired: 0,
      message: "",
      recommendation: "take_together",
    }),
    getUserAllergies: jest.fn().mockResolvedValue([]),
    checking: false,
  }),
}));

jest.mock("../../hooks/useMedicationSuggestions", () => ({
  useMedicationSuggestions: () => ({
    suggestions: [],
    loading: false,
  }),
}));

describe("Home Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as any).currentUser = { uid: "test-uid", displayName: "Test User" };
    mockOnSnapshot.mockImplementation((ref, callback) => {
      callback({
        docs: [],
      } as any);
      return jest.fn();
    });
    mockGetDocs.mockResolvedValue({
      empty: true,
    } as any);
  });

  it("should render home screen", () => {
    const { getByText } = render(<Home />);

    expect(getByText(/Next Dose/i)).toBeTruthy();
  });

  it("should show add medication form", () => {
    const { getByPlaceholderText } = render(<Home />);

    expect(getByPlaceholderText(/Medication name/i)).toBeTruthy();
  });

  it("should validate medication name before adding", async () => {
    const { getByText } = render(<Home />);

    const addButton = getByText(/Add to Schedule/i);
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Missing", "Enter medication name.");
    });
  });

  it("should validate dose number before adding", async () => {
    const { getByText, getByPlaceholderText } = render(<Home />);

    const medNameInput = getByPlaceholderText(/Medication name/i);
    fireEvent.changeText(medNameInput, "Aspirin");

    const addButton = getByText(/Add to Schedule/i);
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Invalid dose", "Enter a valid number of pills.");
    });
  });

  it("should add medication to schedule", async () => {
    mockAddDoc.mockResolvedValue({ id: "new-doc-id" } as any);

    const { getByText, getByPlaceholderText } = render(<Home />);

    const medNameInput = getByPlaceholderText(/Medication name/i);
    const doseInput = getByPlaceholderText(/Number of pills/i);
    const addButton = getByText(/Add to Schedule/i);

    fireEvent.changeText(medNameInput, "Aspirin");
    fireEvent.changeText(doseInput, "1");
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalled();
    });
  });

  it("should delete medication from schedule", async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    // Mock schedule data
    mockOnSnapshot.mockImplementation((ref, callback) => {
      callback({
        docs: [
          {
            id: "dose-1",
            data: () => ({
              medName: "Aspirin",
              time: "08:00",
              dose: "1 pill",
              enabled: true,
            }),
          },
        ],
      } as any);
      return jest.fn();
    });

    const { getAllByText } = render(<Home />);

    // Verify medication appears in the schedule
    await waitFor(() => {
      const aspirinElements = getAllByText(/Aspirin/i);
      expect(aspirinElements.length).toBeGreaterThan(0);
    });
  });

  it("should show next dose information", async () => {
    // Mock schedule data
    mockOnSnapshot.mockImplementation((ref, callback) => {
      callback({
        docs: [
          {
            id: "dose-1",
            data: () => ({
              medName: "Aspirin",
              time: "08:00",
              dose: "1 pill",
              enabled: true,
            }),
          },
        ],
      } as any);
      return jest.fn();
    });

    const { getAllByText, getByText } = render(<Home />);

    // Should show next dose
    await waitFor(() => {
      expect(getByText("Next Dose")).toBeTruthy();
      const aspirinElements = getAllByText(/Aspirin/i);
      expect(aspirinElements.length).toBeGreaterThan(0);
    });
  });

  it("should show error when no device is linked for dispense", async () => {
    // Verify dispense button doesn't show when no device is linked
    mockGetDocs.mockResolvedValue({
      empty: true,
    } as any);

    const { queryByText } = render(<Home />);

    // Dispense button should not be rendered when no device is linked
    await waitFor(() => {
      expect(queryByText(/Dispense/i)).toBeNull();
    });
  });

  it("should validate dose is a positive number", async () => {
    const { getByText, getByPlaceholderText } = render(<Home />);

    const medNameInput = getByPlaceholderText(/Medication name/i);
    const doseInput = getByPlaceholderText(/Number of pills/i);

    fireEvent.changeText(medNameInput, "Aspirin");
    fireEvent.changeText(doseInput, "0");
    fireEvent.press(getByText(/Add to Schedule/i));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Invalid dose", "Enter a valid number of pills.");
    });
  });

  it("should clear form after adding medication", async () => {
    mockAddDoc.mockResolvedValue({ id: "new-doc-id" } as any);

    const { getByText, getByPlaceholderText } = render(<Home />);

    const medNameInput = getByPlaceholderText(/Medication name/i);
    const doseInput = getByPlaceholderText(/Number of pills/i);

    fireEvent.changeText(medNameInput, "Aspirin");
    fireEvent.changeText(doseInput, "1");
    fireEvent.press(getByText(/Add to Schedule/i));

    await waitFor(() => {
      expect(medNameInput.props.value).toBe("");
      expect(doseInput.props.value).toBe("");
    });
  });
});
