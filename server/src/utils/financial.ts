import crypto from "crypto";

export function addMonths(dateStr: string, months: number): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  const d = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() !== d) {
    date.setDate(0); // vai para o último dia do mês anterior se o dia atual for maior
  }
  return date.toISOString().split("T")[0];
}

export interface TransactionInput {
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  account: string;
  recurrenceType?: "NONE" | "FIXED" | "INSTALLMENT";
  installmentTotal?: number;
  isPaid?: boolean;
}

export function generateTransactions(data: TransactionInput, userId: string): any[] {
  const transactionsToCreate: any[] = [];
  const recurrenceGroupId = (data.recurrenceType === "INSTALLMENT" || data.recurrenceType === "FIXED")
    ? crypto.randomUUID()
    : null;

  if (data.recurrenceType === "INSTALLMENT" && data.installmentTotal && data.installmentTotal > 1) {
    const total = data.amount;
    const n = data.installmentTotal;
    const baseAmount = Math.floor((total / n) * 100) / 100;
    const firstAmount = Math.round((total - (baseAmount * (n - 1))) * 100) / 100;

    for (let i = 0; i < n; i++) {
      transactionsToCreate.push({
        ...data,
        userId,
        amount: i === 0 ? firstAmount : baseAmount,
        date: addMonths(data.date, i),
        recurrenceGroupId,
        installmentCurrent: i + 1,
        installmentTotal: n,
        isPaid: i === 0 ? data.isPaid : false,
      });
    }
  } else if (data.recurrenceType === "FIXED") {
    for (let i = 0; i < 12; i++) {
      transactionsToCreate.push({
        ...data,
        userId,
        date: addMonths(data.date, i),
        recurrenceGroupId,
        isPaid: i === 0 ? data.isPaid : false,
      });
    }
  } else {
    transactionsToCreate.push({
      ...data,
      userId,
    });
  }

  return transactionsToCreate;
}

