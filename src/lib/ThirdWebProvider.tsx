"use client"; // Ensure it's a client component

import { ThirdwebProvider } from "thirdweb/react";

export function Providers({ children }: { children: React.ReactNode }) {
    return <ThirdwebProvider>{children}</ThirdwebProvider>;
}