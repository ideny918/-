// 영수증 조판 컴포넌트 (점선 리더 · 절취선 · 도장)
import type { ReactNode } from "react";

export function Receipt({
  children,
  className = "",
  torn = true,
}: {
  children: ReactNode;
  className?: string;
  torn?: boolean;
}) {
  return (
    <div className="receipt-wrap">
      <section
        className={`relative bg-receipt px-6 pt-7 pb-10 sm:px-9 ${torn ? "tear-bottom" : ""} ${className}`}
        style={{ borderRadius: "2px 2px 0 0" }}
      >
        {children}
      </section>
    </div>
  );
}

export function LeaderRow({
  label,
  value,
  note,
}: {
  label: ReactNode;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="flex items-baseline text-[13px]">
      <span className="text-ink-soft">{label}</span>
      <span className="leader" aria-hidden="true" />
      <span className="tnum font-[family-name:var(--font-mono)] font-medium text-ink">
        {value}
      </span>
      {note ? <span className="ml-2 text-[11px] text-ink-faint">{note}</span> : null}
    </div>
  );
}

export function Rule({ label }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="rule-dotted flex-1" />
      {label ? <span className="label">{label}</span> : null}
      <span className="rule-dotted flex-1" />
    </div>
  );
}

export function SectionHeading({
  index,
  title,
  desc,
}: {
  index: string;
  title: string;
  desc?: string;
}) {
  return (
    <header className="mb-5">
      <div className="flex items-baseline gap-3">
        <span className="label text-teal">{index}</span>
        <h2 className="font-[family-name:var(--font-display)] text-[22px] leading-tight font-semibold sm:text-[26px]">
          {title}
        </h2>
      </div>
      {desc ? (
        <p className="mt-1.5 max-w-[52ch] text-[13px] leading-relaxed text-ink-soft">
          {desc}
        </p>
      ) : null}
    </header>
  );
}

/** 손으로 그린 원형 도장 */
export function Stamp({ text = "RECORDED · 하루 기록 ·" }: { text?: string }) {
  return (
    <svg
      width="112"
      height="112"
      viewBox="0 0 112 112"
      aria-hidden="true"
      className="opacity-[0.55]"
    >
      <defs>
        <path
          id="stamp-circle"
          d="M56 56 m -38 0 a 38 38 0 1 1 76 0 a 38 38 0 1 1 -76 0"
        />
      </defs>
      <circle
        cx="56"
        cy="56"
        r="52"
        fill="none"
        stroke="var(--color-teal)"
        strokeWidth="2"
        strokeDasharray="3 3"
      />
      <circle
        cx="56"
        cy="56"
        r="30"
        fill="none"
        stroke="var(--color-teal)"
        strokeWidth="1.2"
      />
      <text
        fill="var(--color-teal)"
        style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.18em" }}
      >
        <textPath href="#stamp-circle" startOffset="4%">
          {text}
        </textPath>
      </text>
      <path
        d="M42 57.5 l9 9 l20 -21"
        fill="none"
        stroke="var(--color-teal)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "teal" | "sand" | "steel" | "sage";
}) {
  const tones: Record<string, string> = {
    neutral: "border-rule text-ink-soft",
    teal: "border-teal text-teal",
    sand: "border-sand text-sand",
    steel: "border-steel text-steel",
    sage: "border-sage text-[#5c7a6c]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-[2px] border px-2 py-[3px] font-[family-name:var(--font-mono)] text-[11px] tracking-[0.08em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** 서점 영수증 상단 — 상호·발행 정보 */
export function ShopHeader({ no, issued }: { no: string; issued: string }) {
  return (
    <div className="text-center">
      <p className="font-[family-name:var(--font-display)] text-[27px] leading-none font-bold tracking-[0.14em]">
        온새미로
      </p>
      <p className="mt-2.5 text-[11px] leading-relaxed text-ink-soft">
        햇살이 온전히 퍼져 비치는 아침 · 매일의 기록을 정리해 드리는 작은 가게
      </p>
      <p className="label mt-1.5">ONSAEMIRO · SINCE 2026</p>
      <div className="mt-4 flex items-center justify-center gap-4 font-[family-name:var(--font-mono)] text-[11px] text-ink-faint">
        <span>No. {no}</span>
        <span className="text-rule">|</span>
        <span>{issued}</span>
      </div>
    </div>
  );
}

/** 영수증 하단 바코드 */
export function Barcode({ code }: { code: string }) {
  const bars: number[] = [];
  for (let i = 0; i < 62; i += 1) {
    bars.push(1 + ((code.charCodeAt(i % code.length) + i * 5) % 3));
  }
  let x = 0;
  return (
    <svg
      viewBox="0 0 200 44"
      className="mx-auto h-[44px] w-[200px]"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {bars.map((w, i) => {
        const el = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={44} fill="var(--color-ink)" /> : null;
        x += w + 1.6;
        return el;
      })}
    </svg>
  );
}

export function ShopFooter({ note }: { note?: string }) {
  return (
    <div className="text-center">
      <p className="mx-auto max-w-[38ch] font-[family-name:var(--font-display)] text-[14px] leading-[1.9] font-semibold">
        책 한 권, 따뜻한 차 한 잔처럼 온전하게 살아낸 오늘의 당신을 깊이 응원합니다.
      </p>
      {note ? (
        <p className="mt-2 text-[10.5px] leading-relaxed text-ink-faint">{note}</p>
      ) : null}
    </div>
  );
}
