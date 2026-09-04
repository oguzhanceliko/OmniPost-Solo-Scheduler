import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OmniPost Solo Scheduler",
  description: "Shorts, Reels & TikTok Automation",
  other: {
    "tiktok-developers-site-verification": "6k7HpUSaQ3rTtZfCXLGI2vsnVbPgDkMs",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="tiktok-developers-site-verification" content="tiktok-developers-site-verification=6k7HpUSaQ3rTtZfCXLGI2vsnVbPgDkMs" />
      </head>
      <body className="min-h-full flex flex-col">
        {/* TikTok Verification Signature */}
        <div style={{ display: 'none' }} id="tiktok-developers-site-verification">
          tiktok-developers-site-verification=6k7HpUSaQ3rTtZfCXLGI2vsnVbPgDkMs
        </div>
        {children}
      </body>
    </html>
  );
}
