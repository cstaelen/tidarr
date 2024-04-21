import type { Metadata, Viewport } from "next";
import Script from "next/script";

export const viewport: Viewport = {
  themeColor: "black",
};

export const metadata: Metadata = {
  title: "Tidarr",
  description: "Unofficial Tital media downloader",
  applicationName: "Tidarr",
  manifest: "/favicon/manifest.json",
  icons: [
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      type: "image/svg",
      url: "/favicon/apple-touch-icon.png",
    },
    {
      type: "image/svg",
      rel: "icon",
      sizes: "32x32",
      url: "/favicon/favicon-32x32.png",
    },
    {
      type: "image/svg",
      rel: "icon",
      sizes: "16x16",
      url: "/favicon/favicon-16x16.png",
    },
    {
      rel: "manifest",
      url: "favicon/site.webmanifest",
    },
    {
      rel: "mask-icon",
      url: "favicon/safari-pinned-tab.svg",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Script src="/env-config.js" async={false} defer={false}></Script>
      <body>{children}</body>
    </html>
  );
}
