import type { Metadata } from "next";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import ThemeProvider from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "Lisamsolutions - HR & Project Management",
  description: "HR & Project Management Tool",
};

const themeInitScript = `
  (function () {
    try {
      var stored = window.localStorage.getItem("lisam_theme_settings");
      if (!stored) return;
      var theme = JSON.parse(stored);
      var root = document.documentElement;
      var primary = /^#[0-9a-f]{6}$/i.test(theme.primaryColor || "") ? theme.primaryColor : "#03a9f3";
      var secondary = /^#[0-9a-f]{6}$/i.test(theme.secondaryColor || "") ? theme.secondaryColor : "#041731";
      var background = /^#[0-9a-f]{6}$/i.test(theme.backgroundColor || "") ? theme.backgroundColor : "#f6f7f9";
      var foreground = /^#[0-9a-f]{6}$/i.test(theme.foregroundColor || "") ? theme.foregroundColor : "#041731";
      var hex = primary.replace("#", "");
      var rgb = parseInt(hex.slice(0, 2), 16) + " " + parseInt(hex.slice(2, 4), 16) + " " + parseInt(hex.slice(4, 6), 16);
      root.style.setProperty("--primary", primary);
      root.style.setProperty("--primary-rgb", rgb);
      root.style.setProperty("--secondary", secondary);
      root.style.setProperty("--background", background);
      root.style.setProperty("--foreground", foreground);
      root.style.setProperty("--app-radius", Math.min(Math.max(Number(theme.radius || 8), 2), 18) + "px");
      root.dataset.sidebarTheme = theme.sidebarTheme || "dark";
      root.dataset.navbarTheme = theme.navbarTheme || "light";
      root.dataset.density = theme.density || "comfortable";
    } catch (error) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <NextTopLoader color="var(--primary)" showSpinner={false} />
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
