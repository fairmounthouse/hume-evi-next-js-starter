import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { cn } from "@/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RecordingAnchorProvider } from "@/hooks/useRecordingAnchor";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  title: "Skillflo.AI",
  description: "AI Powered Interviewing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <script 
            src="https://embed.cloudflarestream.com/embed/sdk.latest.js" 
            async 
          />
        </head>
        <body
          suppressHydrationWarning
          className={cn(
            GeistSans.variable,
            GeistMono.variable,
            "flex flex-col min-h-screen"
          )}
        >
          {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
            <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
          )}
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <RecordingAnchorProvider>
              {children}
              <Toaster position="top-center" richColors={true} />
            </RecordingAnchorProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
