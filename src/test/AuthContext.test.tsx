import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import React from "react";

global.fetch = vi.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthContext", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it("should initialize with values from localStorage", async () => {
    localStorage.setItem("ledger_auth_token", "saved-token");
    localStorage.setItem("ledger_auth_user", JSON.stringify({ id: "1", name: "Test" }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBe("saved-token");
    expect(result.current.user?.name).toBe("Test");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle corrupted localStorage gracefully", () => {
    localStorage.setItem("ledger_auth_token", "saved-token");
    localStorage.setItem("ledger_auth_user", "invalid-json");

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBe(null);
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("ledger_auth_token")).toBeNull();
  });

  it("should throw error if useAuth is used outside provider", () => {
    // Suppress console.error for expected throw
    const origError = console.error;
    console.error = vi.fn();
    expect(() => renderHook(() => useAuth())).toThrow("useAuth deve ser utilizado dentro de um AuthProvider");
    console.error = origError;
  });

  describe("login", () => {
    it("should login successfully via API", async () => {
      const mockData = { token: "new-token", user: { id: "2", name: "API User" } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("test@test.com", "pass");
      });

      expect(result.current.token).toBe("new-token");
      expect(result.current.user?.name).toBe("API User");
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem("ledger_auth_token")).toBe("new-token");
    });

    it("should handle API failure", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Wrong password" }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(result.current.login("test@test.com", "pass")).rejects.toThrow("Wrong password");
    });

    it("should fallback to mock login on network error", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Failed to fetch"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("test@test.com", "pass");
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toMatch(/^mock-jwt-token-/);
      expect(result.current.user?.email).toBe("test@test.com");
    });
  });

  describe("register", () => {
    it("should register successfully via API", async () => {
      const mockData = { token: "reg-token", user: { id: "3", name: "Reg User" } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register("Reg User", "test@test.com", "pass");
      });

      expect(result.current.token).toBe("reg-token");
    });

    it("should handle API register failure", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(result.current.register("N", "e", "p")).rejects.toThrow("Erro ao criar conta.");
    });

    it("should fallback to mock register on network error", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Failed to fetch"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register("Local User", "local@test.com", "pass");
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.name).toBe("Local User");
    });
  });

  describe("logout & loginDemo", () => {
    it("should login with demo user and logout", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.loginDemo();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe("rafael@exemplo.com");
      expect(localStorage.getItem("ledger_auth_token")).toBe("demo-jwt-token-bolsocerto");

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem("ledger_auth_token")).toBeNull();
    });
  });
});

