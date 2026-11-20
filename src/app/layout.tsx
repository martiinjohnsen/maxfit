import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maxfit | Din trening, samlet",
  description: "En enkel plass for trening, mat, innsjekk og kontakt med coachen din.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="nb"><body>{children}</body></html>;
}
