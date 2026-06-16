import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/Providers";
import { Toaster } from "react-hot-toast";

import {
  Allura,
  Great_Vibes,
  Dancing_Script,
  Pacifico,
  Cedarville_Cursive,
} from "next/font/google";
import TimerWatcher from "./TimerWatcher";

export const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-allura",
});

export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
});

export const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dancing-script",
});

export const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
});

export const cedarvilleCursive = Cedarville_Cursive({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cedarville-cursive",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});




export const metadata = {
  title: "HumanEdge | HR Management",
  description: "All-in-one HR operations platform — attendance, payroll, contracts, and multi-company management.",
  manifest: "/manifest.webmenifest",
  themeColor: "#2563EB",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HumanEdge",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${allura.variable} ${greatVibes.variable} ${dancingScript.variable} ${pacifico.variable} ${cedarvilleCursive.variable} antialiased`}
      >
        <Providers>
          {children}
          {/* <TimerWatcher /> */}

          <Toaster position="bottom-center" />
        </Providers>
      </body>
    </html>
  );
}
