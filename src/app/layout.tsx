import type { Metadata } from "next";
import { Syne, Space_Mono, Silkscreen, Press_Start_2P } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/ui/CustomCursor";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/layout/CartDrawer";
import Footer from "@/components/layout/Footer";
import SplashScreen from "@/components/layout/SplashScreen";
import GlobalPixelAnim from "@/components/layout/GlobalPixelAnim";
import GlobalFlashlight from "@/components/layout/GlobalFlashlight";
import Toast from "@/components/ui/Toast";
import { AuthProvider } from "@/components/providers/AuthProvider";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const pressStart2P = Press_Start_2P({
  variable: "--font-start2p",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DOTT. | Make Your Mark.",
  description: "Pixel stickers. Drop culture. No residue.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${spaceMono.variable} ${silkscreen.variable} ${pressStart2P.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-dott-bg text-dott-white relative font-body selection:bg-dott-white selection:text-dott-bg">
        <AuthProvider>
          <SplashScreen />
          <div className="bg-dott-grid fixed inset-0 -z-50 opacity-50 pointer-events-none print:hidden" />
          <div className="scanlines print:hidden" />
          <div className="film-grain print:hidden" />
          <div className="vignette print:hidden" />
          <div className="print:hidden">
            <GlobalFlashlight />
            <GlobalPixelAnim />
            <CustomCursor />
            <Navbar />
            <CartDrawer />
            <Toast />
          </div>
          <main className="flex-grow pt-20 print:pt-0">
            {children}
          </main>
          <div className="print:hidden">
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
