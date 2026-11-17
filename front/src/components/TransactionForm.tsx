import { useState, useRef } from "react";
import { paymentMethods, Transaction } from "@/lib/mock-data";
import { useFinance } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Paperclip, X, FileText } from "lucide-react";

interface TransactionFormProps {
  onSubmit: () => void;
  initial?: Transaction;
}

type TransactionWithReceipt = Transaction & {
  receiptUrl?: string | null;
  receiptName?: string | null;
};

export function TransactionForm({ onSubmit, initial }: TransactionFormProps) {
  const { accounts, categories, addTransaction, updateTransaction } = useFinance();
  const initialTx = initial as TransactionWithReceipt | undefined;

  const [type, setType] = useState<"income" | "expense">(initial?.type ?? "expense");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod ?? "");
  const [account, setAccount] = useState(initial?.account ?? "");

  const [recurrenceType, setRecurrenceType] = useState<"NONE" | "FIXED" | "INSTALLMENT">(initial?.recurrenceType ?? "NONE");
  const [installmentTotal, setInstallmentTotal] = useState<number | "">(initial?.installmentTotal ?? "");
  const [isPaid, setIsPaid] = useState<boolean>(initial?.isPaid ?? true);

  const [receiptUrl, setReceiptUrl] = useState<string | null>(initialTx?.receiptUrl ?? null);
  const [receiptName, setReceiptName] = useState<string | null>(initialTx?.receiptName ?? null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === "both"
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setFileError("Formato inválido. Envie apenas PDF ou imagem (JPG, PNG, WEBP).");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError("O arquivo deve ter no máximo 5MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptUrl(reader.result as string);
      setReceiptName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptUrl(null);
    setReceiptName(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    const data: Omit<Transaction, "id"> & {
      receiptUrl?: string | null;
      receiptName?: string | null;
    } = {
      amount: parseFloat(amount),
      type,
      category,
      description,
      date,
      paymentMethod,
      account,
      recurrenceType,
      isPaid,
      receiptUrl: type === "expense" ? receiptUrl : null,
      receiptName: type === "expense" ? receiptName : null,
    };

    if (recurrenceType === "INSTALLMENT" && installmentTotal) {
      data.installmentTotal = Number(installmentTotal);
    }

    if (initial) {
      updateTransaction(initial.id, data);
    } else {
      addTransaction(data);
    }
    onSubmit();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const numInstallments = typeof installmentTotal === "number" ? installmentTotal : parseInt(installmentTotal as string) || 1;
  const installmentValue = numInstallments > 1 ? (parsedAmount / numInstallments) : parsedAmount;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 p-1 bg-accent rounded-lg">
        <button
          type="button"
          onClick={() => { setType("expense"); setCategory(""); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
            type === "expense"
              ? "bg-card shadow-sm text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Despesa
        </button>
        <button
          type="button"
          onClick={() => { setType("income"); setCategory(""); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
            type === "income"
              ? "bg-card shadow-sm text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Receita
        </button>
      </div>

      <div>
        <Label className="text-label mb-1.5 block">Valor</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-mono tabular-nums text-lg"
          autoFocus
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-label mb-1.5 block">Categoria</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-label mb-1.5 block">Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>

      <div>
        <Label className="text-label mb-1.5 block">Descrição</Label>
        <Input
          placeholder="Para que foi isso?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-label mb-1.5 block">Frequência</Label>
          <Select 
            value={recurrenceType} 
            onValueChange={(val) => setRecurrenceType(val as "NONE"|"FIXED"|"INSTALLMENT")}
          >
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Única</SelectItem>
              <SelectItem value="FIXED">Fixa (Mensal)</SelectItem>
              <SelectItem value="INSTALLMENT">Parcelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {recurrenceType === "INSTALLMENT" && (
          <div>
            <Label className="text-label mb-1.5 block">Parcelas</Label>
            <Input 
              type="number" 
              min="2" 
              max="48"
              value={installmentTotal}
              onChange={(e) => setInstallmentTotal(e.target.value === "" ? "" : Number(e.target.value))}
              required
            />
          </div>
        )}
      </div>

      {recurrenceType === "INSTALLMENT" && numInstallments > 1 && parsedAmount > 0 && (
        <div className="text-sm text-muted-foreground bg-accent/50 p-2 rounded-md">
          Resumo: {numInstallments}x de {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installmentValue)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-label mb-1.5 block">Forma de Pagamento</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {paymentMethods.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-label mb-1.5 block">Conta</Label>
          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {type === "expense" && (
        <div className="space-y-1.5">
          <Label htmlFor="receipt-upload" className="text-label flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5" />
            Cupom Fiscal (PDF ou Imagem)
          </Label>
          <Input
            id="receipt-upload"
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="cursor-pointer text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-accent file:text-foreground hover:file:bg-accent/80"
          />
          {fileError && (
            <p className="text-xs text-destructive">{fileError}</p>
          )}
          {receiptUrl && (
            <div className="flex items-center justify-between gap-2 bg-accent/60 px-3 py-2 rounded-md text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="truncate font-medium">
                  {receiptName || "Cupom anexado"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveReceipt}
                className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                title="Remover cupom"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center space-x-2 pt-2">
        <Switch id="is-paid" checked={isPaid} onCheckedChange={setIsPaid} />
        <Label htmlFor="is-paid">Transação já foi paga/recebida?</Label>
      </div>

      <Button type="submit" className="w-full mt-2">
        {initial ? "Atualizar Transação" : "Adicionar Transação"}
      </Button>
    </form>
  );
}