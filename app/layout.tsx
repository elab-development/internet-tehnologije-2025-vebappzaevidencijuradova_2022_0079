import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Evidencija radova",
  description: "Aplikacija za predaju radova i ocenjivanje",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    )
}
