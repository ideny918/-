import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import FontPicker from "@/components/FontPicker";
import "./globals.css";

export const metadata: Metadata = {
  title: "온새미로 · 매일의 기록을 정리해 드리는 작은 가게",
  description:
    "수면·복약·수분·하루 일정을 영수증 한 장으로 정리하고 패턴을 읽어드립니다.",
};

const NAV = [
  { href: "/", label: "오늘", code: "01" },
  { href: "/sleep", label: "수면", code: "02" },
  { href: "/meds", label: "복약", code: "03" },
  { href: "/water", label: "수분", code: "04" },
  { href: "/coach", label: "패턴코치", code: "05" },
];

function Mark() {
  return (
    <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M6 3h20v21l-2.5 2.5L21 24l-2.5 2.5L16 24l-2.5 2.5L11 24l-2.5 2.5L6 24z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M18.6 8.2a5.4 5.4 0 1 0 0 8.4 4.5 4.5 0 1 1 0-8.4z"
        fill="currentColor"
      />
      <path
        d="M9.5 20.5h13"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="1 2.6"
      />
    </svg>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Gothic+A1:wght@400;500;700&family=Gowun+Batang:wght@400;700&family=Gowun+Dodum&family=Hahmlet:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;700&family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&family=Nanum+Pen+Script&family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@500;600;700&family=Song+Myung&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen text-ink antialiased">
        <div className="mx-auto flex w-full max-w-[1280px] gap-6 px-4 sm:px-8">
          {/* 좌측 스티키 세로 레일 */}
          <aside className="sticky top-0 hidden h-screen shrink-0 flex-col justify-between border-r border-rule py-10 pr-6 lg:flex">
            <Link href="/" className="text-ink" aria-label="하루 기록 홈">
              <Mark />
            </Link>
            <nav className="flex flex-1 flex-col items-center justify-center gap-8">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-2 text-ink-soft transition-colors hover:text-teal"
                >
                  <span className="label">{item.code}</span>
                  <span
                    className="text-[15px] font-medium tracking-[0.22em]"
                    style={{ writingMode: "vertical-rl" }}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
            <p
              className="label whitespace-nowrap"
              style={{ writingMode: "vertical-rl" }}
            >
              Daily Log 2026
            </p>
          </aside>

          <div className="min-w-0 flex-1">
            {/* 모바일 상단 바 */}
            <header className="flex items-center justify-between gap-4 border-b border-rule py-5 lg:hidden">
              <Link href="/" className="flex items-center gap-2 text-ink">
                <Mark />
                <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[0.1em]">
                  온새미로
                </span>
              </Link>
              <nav className="flex items-center gap-3">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-[13px] text-ink-soft transition-colors hover:text-teal"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </header>

            <main className="py-10 lg:py-14">{children}</main>

            <footer className="border-t border-rule py-8">
              <p className="label">
                온새미로 · 수면 / 복약 / 수분 기록 — 참고용이며 의학적 진단이 아닙니다
              </p>
            </footer>
          </div>
        </div>
        <FontPicker />
      </body>
    </html>
  );
}
