"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    currency: "ILS",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </PayPalScriptProvider>
  );
}