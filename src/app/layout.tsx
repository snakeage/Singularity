import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { AppProvider } from "@/store/AppProvider";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Singularity — трекер цели",
  description:
    "Личный трекер цели: мечта, честный старт, этапы, практики и недельный обзор. Данные локально в браузере.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
