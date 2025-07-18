import { Geist, Geist_Mono } from "next/font/google";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css";
import Navbar from "@/components/Navbar";   //importa la navbar
import 'bootstrap-icons/font/bootstrap-icons.css';    //importa le icone bootstrap

import { ModelProvider } from './context/ModelContext'; //importo il provider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "JaJai",
  description: "AI developed by Astro (from Brainy Labs) using NextJS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ModelProvider>
          <Navbar /> {/* spostata qui come componente client */}
          <main style={{ paddingTop: '80px' }}>{children}</main>
        </ModelProvider>
      </body>
    </html>
  );
}
