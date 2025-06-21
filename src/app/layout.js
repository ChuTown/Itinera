import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./RootComponents/Header";
import Link from "next/link"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Intinera",
  description: "SpurHacks Winner Winner Chicken Dinner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geistSans.variable}>
        <Header></Header>
        {children}
      </body>
    </html>
  );
}
