export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <script src="/env-config.js" async={false} defer={false}></script>
      <body>{children}</body>
    </html>
  );
}
