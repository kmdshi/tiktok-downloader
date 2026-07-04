import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TikTok Downloader | No Watermark HD Video & MP3 Download",
  description:
    "Free online TikTok downloader. Save TikTok videos without watermarks in high-quality MP4 or convert them to MP3 audio easily. Fast, secure, and responsive.",
  keywords: [
    "tiktok downloader",
    "download tiktok",
    "tiktok video download",
    "tiktok no watermark",
    "tiktok mp3 downloader",
    "save tiktok",
    "скачать тикток без водяного знака",
  ],
  authors: [{ name: "TikTok Downloader Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
