import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/Toast";
import { WatchProgressProvider } from "./components/WatchProgressProvider";

export const metadata: Metadata = {
  title: "MyTube - Personal Dashboard",
  description: "A private, personalized YouTube dashboard.",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <WatchProgressProvider>
              {children}
            </WatchProgressProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
