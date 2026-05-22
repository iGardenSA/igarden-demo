import type { Metadata, Viewport } from "next";
import { Tajawal, Poppins } from "next/font/google";
import "@/styles/globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "iGarden Smart OS — نظام تشغيل المزارع المائية الذكية",
    template: "%s · iGarden Smart OS",
  },
  description:
    "iGarden Smart OS — طبقة التشغيل والبيانات تحت المزارع المائية الذكية السعودية. مراقبة · تنبيهات · تحكم تحت إشراف · سجلات تدقيق · تقارير امتثال.",
  robots: { index: false, follow: false }, // demo
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F3D2E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${poppins.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
