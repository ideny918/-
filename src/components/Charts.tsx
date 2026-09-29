// SVG 차트 — 수면 바 차트 / 약효 곡선 (외부 차트 라이브러리 없이 직접 그림)

export interface SleepBarDatum {
  dateLabel: string;
  sleepH: number | null;
  napH: number | null;
  outlier: string | null;
  score: number | null;
  conditionLabel: string;
}

const BAR_COLORS = ["#5B95C8", "#98B4A6", "#A5A6C9", "#4DC9C1"];

export function SleepBars({ data }: { data: SleepBarDatum[] }) {
  const W = 660;
  const H = 240;
  const padL = 34;
  const padB = 42;
  const padT = 18;
  const max = 12;
  const plotH = H - padB - padT;
  const step = (W - padL - 12) / Math.max(data.length, 1);
  const barW = Math.min(46, step * 0.52);
  const y = (h: number) => padT + plotH - (h / max) * plotH;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="일자별 수면 시간 바 차트"
    >
      {[0, 4, 7.5, 12].map((tick) => (
        <g key={tick}>
          <line
            x1={padL}
            x2={W - 8}
            y1={y(tick)}
            y2={y(tick)}
            stroke={tick === 7.5 ? "var(--color-teal)" : "var(--color-rule)"}
            strokeWidth={tick === 7.5 ? "1.5" : "1"}
            strokeDasharray={tick === 7.5 ? "4 3" : "1 4"}
          />
          <text
            x={padL - 8}
            y={y(tick) + 4}
            textAnchor="end"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}
          >
            {tick === 7.5 ? "7h30" : `${tick}h`}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const h = d.sleepH ?? 0;
        const x = padL + step * i + (step - barW) / 2;
        const isOutlier = d.outlier != null;
        return (
          <g key={d.dateLabel + i}>
            <rect
              x={x}
              y={y(h)}
              width={barW}
              height={Math.max(plotH - (y(h) - padT), 0)}
              fill={isOutlier ? "#B98F1F" : BAR_COLORS[i % BAR_COLORS.length]}
              opacity={d.sleepH == null ? 0.25 : 0.92}
              className="grow-bar"
              style={{ animationDelay: `${i * 70}ms` }}
            />
            {d.napH ? (
              <rect
                x={x}
                y={y(h + d.napH)}
                width={barW}
                height={((d.napH / max) * plotH) | 0}
                fill="#B98F1F"
                opacity="0.28"
              />
            ) : null}
            <text
              x={x + barW / 2}
              y={y(h) - 7}
              textAnchor="middle"
              fill="var(--color-ink)"
              style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}
            >
              {d.sleepH == null ? "-" : `${d.sleepH.toFixed(1)}h`}
            </text>
            <text
              x={x + barW / 2}
              y={H - 20}
              textAnchor="middle"
              fill="var(--color-ink-soft)"
              style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}
            >
              {d.dateLabel.slice(0, 5)}
            </text>
            <text
              x={x + barW / 2}
              y={H - 6}
              textAnchor="middle"
              fill="var(--color-ink-faint)"
              style={{ fontFamily: "var(--font-sans)", fontSize: "10px" }}
            >
              {d.conditionLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export interface EffectDatum {
  name: string;
  dose: string | null;
  onsetMin: number | null;
  peakMin: number | null;
  durationH: number | null;
}

const CURVE_COLORS = ["#2C7A72", "#5B95C8", "#B98F1F", "#98B4A6", "#A5A6C9", "#4DC9C1"];

/** 복용 후 경과 시간에 대한 체감 약효 곡선(정점·지속) */
export function EffectCurves({ meds }: { meds: EffectDatum[] }) {
  const W = 660;
  const H = 260;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 52;
  const maxH = 14;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const x = (hour: number) => padL + (hour / maxH) * plotW;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="복용 후 시간에 따른 약효 곡선"
    >
      {[0, 2, 4, 6, 8, 10, 12, 14].map((tick) => (
        <g key={tick}>
          <line
            x1={x(tick)}
            x2={x(tick)}
            y1={padT}
            y2={padT + plotH}
            stroke="var(--color-rule)"
            strokeWidth="1"
            strokeDasharray="1 5"
          />
          <text
            x={x(tick)}
            y={padT + plotH + 18}
            textAnchor="middle"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}
          >
            +{tick}h
          </text>
        </g>
      ))}

      {meds.map((m, i) => {
        const peak = (m.peakMin ?? 60) / 60;
        const dur = m.durationH ?? 8;
        const sigma = Math.max(dur / 3.4, 0.6);
        const points: string[] = [];
        for (let t = 0; t <= maxH; t += 0.25) {
          const v = Math.exp(-Math.pow(t - peak, 2) / (2 * sigma * sigma));
          const yy = padT + plotH - v * (plotH - 10);
          points.push(`${x(t).toFixed(1)},${yy.toFixed(1)}`);
        }
        const color = CURVE_COLORS[i % CURVE_COLORS.length];
        return (
          <g key={m.name}>
            <polyline
              points={points.join(" ")}
              fill="none"
              stroke={color}
              strokeWidth="2"
              className="draw-line"
              style={{ animationDelay: `${i * 90}ms` }}
            />
            <circle cx={x(peak)} cy={padT + 10} r="3.4" fill={color} />
            <text
              x={x(peak)}
              y={padT + 2 + (i % 2) * -14 + 2}
              textAnchor="middle"
              fill={color}
              style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px" }}
            >
              {m.name}
            </text>
          </g>
        );
      })}

      <line
        x1={padL}
        x2={W - padR}
        y1={padT + plotH}
        y2={padT + plotH}
        stroke="var(--color-ink)"
        strokeWidth="1.4"
      />
    </svg>
  );
}
