import type { Metadata } from "next";
import "./globals.css";

// Using system fonts to avoid build issues
const geistSans = {
  variable: "--font-geist-sans",
  className: "font-sans"
};

const geistMono = {
  variable: "--font-geist-mono", 
  className: "font-mono"
};

export const metadata: Metadata = {
  title: "Recruitment AI - AI-Powered Hiring Platform",
  description: "Intelligent recruitment platform powered by AI. Automatically process CVs, extract candidate information, and match candidates to job requirements with advanced scoring and analysis.",
  keywords: "recruitment, AI, hiring, job matching, resume parsing, candidate management",
  authors: [{ name: "Recruitment AI Team" }],
  robots: "index, follow",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning={true}>
        <div id="root" className="relative flex min-h-screen flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
        <div id="modal-root" />
      </body>
    </html>
  );
}
