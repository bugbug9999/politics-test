import type { Metadata } from "next";
import "./globals.css";
import Analytics from "./Analytics";

export const metadata: Metadata = {
  title: "나는 어떤 정치성향?",
  description:
    "진영·온도·근거·행동 4축으로 보는 한국형 정치성향 풍자 테스트. 20유형 중 내 유형은?",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
      <Analytics />
    </html>
  );
}
