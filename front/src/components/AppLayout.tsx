import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { QuickAddFAB } from "./QuickAddFAB";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <MobileNav />
      <main className="md:ml-60 pb-20 md:pb-0">
        <div className="max-w-[1200px] mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
      <QuickAddFAB />
    </div>
  );
}
