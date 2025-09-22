import "./globals.css";
import { AuthProvider } from "../lib/auth";

export const metadata = {
  title: "B2B Store frontend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
