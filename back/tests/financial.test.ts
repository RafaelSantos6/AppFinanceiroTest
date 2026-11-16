import { describe, it, expect } from "vitest";
import { addMonths, generateTransactions, TransactionInput } from "../src/utils/financial";

describe("Financial Utils", () => {
  describe("addMonths", () => {
    it("should add 1 month correctly", () => {
      expect(addMonths("2026-01-15", 1)).toBe("2026-02-15");
    });
    it("should handle end of month leap year (2024)", () => {
      expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    });
    it("should handle end of month non-leap year (2026)", () => {
      expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    });
    it("should handle cross year", () => {
      expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    });
  });

  describe("generateTransactions", () => {
    const baseData: TransactionInput = {
      amount: 100,
      type: "expense",
      category: "Food",
      description: "Groceries",
      date: "2026-01-15",
      paymentMethod: "CREDIT_CARD",
      account: "Main",
      isPaid: true
    };
    const userId = "user123";

    it("should generate a single transaction for NONE recurrence", () => {
      const data = { ...baseData, recurrenceType: "NONE" as const };
      const txs = generateTransactions(data, userId);
      expect(txs.length).toBe(1);
      expect(txs[0].userId).toBe(userId);
      expect(txs[0].amount).toBe(100);
      expect(txs[0].recurrenceGroupId).toBeUndefined();
    });

    it("should generate 12 transactions for FIXED recurrence", () => {
      const data = { ...baseData, recurrenceType: "FIXED" as const };
      const txs = generateTransactions(data, userId);
      expect(txs.length).toBe(12);
      expect(txs[0].recurrenceGroupId).toBeDefined();
      expect(txs[1].recurrenceGroupId).toBe(txs[0].recurrenceGroupId);
      
      expect(txs[0].date).toBe("2026-01-15");
      expect(txs[1].date).toBe("2026-02-15");
      expect(txs[11].date).toBe("2026-12-15");
      
      expect(txs[0].isPaid).toBe(true);
      expect(txs[1].isPaid).toBe(false);
    });

    it("should divide exactly R$ 100,00 in 3x (33.34, 33.33, 33.33)", () => {
      const data = { ...baseData, recurrenceType: "INSTALLMENT" as const, installmentTotal: 3 };
      const txs = generateTransactions(data, userId);
      
      expect(txs.length).toBe(3);
      expect(txs[0].amount).toBe(33.34);
      expect(txs[1].amount).toBe(33.33);
      expect(txs[2].amount).toBe(33.33);
      
      const sum = txs.reduce((acc, t) => acc + t.amount, 0);
      expect(Math.round(sum * 100) / 100).toBe(100);
      
      expect(txs[0].installmentCurrent).toBe(1);
      expect(txs[2].installmentCurrent).toBe(3);
      expect(txs[0].installmentTotal).toBe(3);
      
      expect(txs[0].isPaid).toBe(true);
      expect(txs[1].isPaid).toBe(false);
      expect(txs[0].recurrenceGroupId).toBeDefined();
    });
  });
});
