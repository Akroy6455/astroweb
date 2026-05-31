import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import CursorGlow from "@/components/CursorGlow";
import BackgroundChakra from "@/components/BackgroundChakra";
import CookieConsent from "@/components/CookieConsent";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  variable: "--font-cormorant",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tara Nirnay",
  description: "सबसे उन्नत एल्गोरिदम आधारित फालित ज्योतिष वेब एप्लिकेशन में से एक",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>

        <BackgroundChakra />
        <CursorGlow />
        {children}
        <CookieConsent />
      
        </ThemeProvider>
      </body>
    </html>
  );
}

