import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Review-to-Revenue (R2R)",
  description:
    "Turn raw customer reviews into objection-crushing creative packs with Google Gemini."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
