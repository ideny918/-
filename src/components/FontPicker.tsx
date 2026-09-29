"use client";

// 글꼴 선택 — 기본 제공 글꼴 중에서 고르거나, 원하는 글꼴 파일을 직접 올려 사용한다.
// 선택은 브라우저(localStorage)에, 올린 파일은 IndexedDB에 보관한다.
import { useCallback, useEffect, useRef, useState } from "react";

type Role = "sans" | "display";

interface FontChoice {
  id: string;
  label: string;
  stack: string;
  custom?: boolean;
}

const PRESETS: FontChoice[] = [
  { id: "noto-sans", label: "노토 산스", stack: "'Noto Sans KR', sans-serif" },
  { id: "ibm-plex-sans", label: "IBM Plex Sans KR", stack: "'IBM Plex Sans KR', sans-serif" },
  { id: "gothic-a1", label: "고딕 A1", stack: "'Gothic A1', sans-serif" },
  { id: "gowun-dodum", label: "고운돋움", stack: "'Gowun Dodum', sans-serif" },
  { id: "nanum-gothic", label: "나눔고딕", stack: "'Nanum Gothic', sans-serif" },
  { id: "nanum-myeongjo", label: "나눔명조", stack: "'Nanum Myeongjo', serif" },
  { id: "gowun-batang", label: "고운바탕", stack: "'Gowun Batang', serif" },
  { id: "song-myung", label: "송명", stack: "'Song Myung', serif" },
  { id: "hahmlet", label: "함렛", stack: "'Hahmlet', serif" },
  { id: "nanum-pen", label: "나눔손글씨", stack: "'Nanum Pen Script', cursive" },
  { id: "gaegu", label: "개구리체", stack: "'Gaegu', cursive" },
  { id: "custom", label: "내 파일", stack: "", custom: true },
];

const DEFAULTS: Record<Role, string> = {
  sans: "noto-sans",
  display: "gowun-batang",
};
const ROLE_LABEL: Record<Role, string> = { sans: "본문 글꼴", display: "제목 글꼴" };
const VAR_NAME: Record<Role, string> = { sans: "--font-sans", display: "--font-display" };
const STORAGE_KEY = "onsemiro-font-choice";
const CUSTOM_FACE = "온새미로-사용자글꼴";

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("onsemiro-fonts", 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("files")) {
        req.result.createObjectStore("files");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<ArrayBuffer | null> {
  try {
    const db = await idbOpen();
    return await new Promise((resolve) => {
      const tx = db.transaction("files", "readonly");
      const req = tx.objectStore("files").get(key);
      req.onsuccess = () => resolve((req.result as ArrayBuffer) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: ArrayBuffer): Promise<void> {
  try {
    const db = await idbOpen();
    await new Promise<void>((resolve) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* 저장 실패 시 이번 세션에만 적용 */
  }
}

export default function FontPicker() {
  const [open, setOpen] = useState(false);
  const [choices, setChoices] = useState<Record<Role, string>>(DEFAULTS);
  const [customName, setCustomName] = useState<string>("글꼴 파일");
  const [message, setMessage] = useState<string | null>(null);
  const sansFileRef = useRef<HTMLInputElement>(null);
  const displayFileRef = useRef<HTMLInputElement>(null);

  const apply = useCallback((role: Role, choiceId: string, stack?: string) => {
    const preset = PRESETS.find((p) => p.id === choiceId);
    const value = stack ?? preset?.stack ?? "";
    if (value) {
      document.documentElement.style.setProperty(VAR_NAME[role], value);
    }
  }, []);

  // 저장된 선택 복원 + 올린 글꼴 파일 등록
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let saved: Partial<Record<Role, string>> = {};
      try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      } catch {
        saved = {};
      }
      const buffer = await idbGet("custom");
      if (buffer) {
        try {
          const face = new FontFace(CUSTOM_FACE, buffer);
          await face.load();
          document.fonts.add(face);
          if (!cancelled) setCustomName("올린 글꼴 사용 중");
        } catch {
          /* 손상된 파일은 무시 */
        }
      }
      if (cancelled) return;
      const next = {
        sans: saved.sans ?? DEFAULTS.sans,
        display: saved.display ?? DEFAULTS.display,
      };
      setChoices(next);
      apply("sans", next.sans);
      apply("display", next.display);
    })();
    return () => {
      cancelled = true;
    };
  }, [apply]);

  function choose(role: Role, choiceId: string) {
    const next = { ...choices, [role]: choiceId };
    setChoices(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (choiceId === "custom") {
      (role === "sans" ? sansFileRef : displayFileRef).current?.click();
      return;
    }
    apply(role, choiceId);
  }

  async function onFile(role: Role, file: File | undefined) {
    if (!file) return;
    setMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const face = new FontFace(CUSTOM_FACE, buffer);
      await face.load();
      document.fonts.add(face);
      await idbSet("custom", buffer);
      const stack = `'${CUSTOM_FACE}', 'Noto Sans KR', sans-serif`;
      const next = { ...choices, [role]: "custom" };
      setChoices(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      apply(role, "custom", stack);
      setCustomName(file.name);
      setMessage(`'${file.name}' 글꼴을 적용했어요.`);
    } catch {
      setMessage("글꼴 파일을 읽지 못했어요. ttf / otf / woff / woff2 파일을 올려 주세요.");
    }
  }

  return (
    <div className="fixed right-5 bottom-5 z-50 print:hidden">
      {open ? (
        <div className="w-[300px] border border-rule bg-receipt p-5 shadow-[0_18px_40px_rgba(45,41,31,0.18)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="label">FONT</p>
              <p className="mt-1 text-[14px] font-semibold">글꼴 고르기</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[18px] leading-none text-ink-soft hover:text-teal"
              aria-label="글꼴 패널 닫기"
            >
              ×
            </button>
          </div>

          {(["sans", "display"] as Role[]).map((role) => (
            <div key={role} className="mt-4">
              <p className="label">{ROLE_LABEL[role]}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => choose(role, p.id)}
                    className={`rounded-[2px] border px-2 py-[5px] text-[11px] transition-colors ${
                      choices[role] === p.id
                        ? "border-teal bg-teal text-receipt"
                        : "border-rule bg-receipt text-ink-soft hover:border-teal hover:text-teal"
                    }`}
                    style={p.custom ? undefined : { fontFamily: p.stack }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <input
            ref={sansFileRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/*"
            className="hidden"
            onChange={(e) => onFile("sans", e.target.files?.[0])}
          />
          <input
            ref={displayFileRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/*"
            className="hidden"
            onChange={(e) => onFile("display", e.target.files?.[0])}
          />

          <p className="mt-4 border-t border-dashed border-rule pt-3 text-[11px] leading-relaxed text-ink-soft">
            <strong className="text-ink">내 파일</strong>을 고르면 ttf · otf · woff · woff2 글꼴을
            올려 바로 쓸 수 있어요. ({customName})
          </p>
          {message ? <p className="mt-2 text-[11px] text-teal">{message}</p> : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-primary shadow-[0_12px_26px_rgba(45,41,31,0.20)]"
        >
          글꼴
        </button>
      )}
    </div>
  );
}
