import type { Metadata } from "next";
import { Providers } from "@/lib/ThirdWebProvider";
import { Wallet } from "@/components/wallet";
import Link from "next/link";
import { Menu, Tickets } from "lucide-react";
import { DashboardLinks } from "@/components/DashboardLinks";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {ReactNode} from "react";


export default async function DashboardLayout({children}: {children: ReactNode}) {
  return (
      <Providers>
        <div className="min-h-screen w-full grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          {/* Sidebar for larger screens */}
          <div className="hidden md:block border-r bg-muted/40">
            <div className="flex h-full max-h-screen flex-col gap-2">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/ticketify/public" className="flex flex-row items-center gap-2">
                  <Tickets />
                  <p className="text-xl font-bold">Ticketify</p>
                </Link>
              </div>
              <div className="flex-1">
                <nav className="grid items-start px-2 lg:px-4">
                  <DashboardLinks />
                </nav>
              </div>
            </div>
          </div>

          {/* Side Bar for smaller screen */}
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
              <Sheet>
                <SheetTrigger className="md:hidden shrink-0">
                  <Menu />
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                  <nav className="grid gap-2 p-4">
                    <DashboardLinks />
                  </nav>
                </SheetContent>
              </Sheet>
              <div className="ml-auto flex items-center gap-x-4">
                <Wallet />
              </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </Providers>
  );
}

