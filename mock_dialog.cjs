const fs = require('fs');
const content = fs.readFileSync('src/test/Transactions.test.tsx', 'utf-8');
const replacement = `
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ open, children }: any) => (open ? <div data-testid="alert-dialog">{children}</div> : null),
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

const mockTransactions`;
fs.writeFileSync('src/test/Transactions.test.tsx', content.replace('const mockTransactions', replacement));
