import React, { useEffect, useState } from "react";

/**
 * 자연을 품은 첫 화면. 5초간 노출된 뒤 서서히 사라지며 메모앱으로 전환된다.
 * 외부 이미지 의존 없이 인라인 SVG로 일출·산·숲 풍경을 그린다.
 */
export default function Splash({ onDone, duration = 5000 }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // duration 종료 0.8초 전부터 페이드아웃 시작
    const fadeAt = Math.max(0, duration - 800);
    const fadeTimer = setTimeout(() => setLeaving(true), fadeAt);
    const doneTimer = setTimeout(() => onDone?.(), duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflow: "hidden",
        opacity: leaving ? 0 : 1,
        transition: "opacity 0.8s ease",
        pointerEvents: leaving ? "none" : "auto",
      }}
      aria-label="자연을 품은 시작 화면"
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          {/* 새벽 하늘 그라데이션 */}
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B2A4A" />
            <stop offset="38%" stopColor="#3E5A7A" />
            <stop offset="66%" stopColor="#E0A458" />
            <stop offset="100%" stopColor="#F3C892" />
          </linearGradient>
          {/* 태양 광채 */}
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF3D6" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#F5C572" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#F5C572" stopOpacity="0" />
          </radialGradient>
          {/* 원경 산 */}
          <linearGradient id="mtnFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A6076" />
            <stop offset="100%" stopColor="#33465C" />
          </linearGradient>
          {/* 근경 언덕 */}
          <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2F5D3A" />
            <stop offset="100%" stopColor="#173B25" />
          </linearGradient>
          <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3E7A4E" />
            <stop offset="100%" stopColor="#255B36" />
          </linearGradient>
        </defs>

        {/* 하늘 */}
        <rect x="0" y="0" width="1440" height="900" fill="url(#sky)" />

        {/* 별 (상단) */}
        <g fill="#FFFFFF" opacity="0.7">
          <circle cx="180" cy="90" r="1.6" />
          <circle cx="360" cy="150" r="1.2" />
          <circle cx="540" cy="70" r="1.4" />
          <circle cx="1020" cy="110" r="1.3" />
          <circle cx="1220" cy="160" r="1.6" />
          <circle cx="1330" cy="80" r="1.2" />
          <circle cx="720" cy="120" r="1.1" />
        </g>

        {/* 태양과 광채 */}
        <circle cx="720" cy="470" r="360" fill="url(#sunGlow)" />
        <circle cx="720" cy="470" r="86" fill="#FFE9BE" />

        {/* 원경 산맥 */}
        <path
          d="M0 560 L180 430 L340 540 L520 400 L700 520 L880 410 L1080 540 L1260 440 L1440 560 L1440 900 L0 900 Z"
          fill="url(#mtnFar)"
          opacity="0.85"
        />

        {/* 중경 언덕 */}
        <path
          d="M0 660 C240 590 420 640 640 620 C860 600 1080 660 1440 620 L1440 900 L0 900 Z"
          fill="url(#hillMid)"
        />

        {/* 근경 언덕 */}
        <path
          d="M0 760 C300 700 520 760 760 740 C1000 720 1200 780 1440 740 L1440 900 L0 900 Z"
          fill="url(#hillNear)"
        />

        {/* 나무 실루엣 */}
        <g fill="#123020">
          {[
            [120, 792], [200, 800], [280, 786], [1180, 792],
            [1280, 800], [1360, 784],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <rect x="-3" y="0" width="6" height="34" />
              <path d="M0 -56 L26 6 L-26 6 Z" />
              <path d="M0 -34 L20 20 L-20 20 Z" />
            </g>
          ))}
        </g>

        {/* 새 두 마리 */}
        <g stroke="#1B2A4A" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7">
          <path d="M470 250 q14 -12 28 0 q14 -12 28 0" />
          <path d="M560 210 q10 -9 20 0 q10 -9 20 0" />
        </g>
      </svg>

      {/* 문구 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
          color: "#0F1B2D",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            fontSize: "clamp(28px, 6vw, 56px)",
            fontWeight: 800,
            letterSpacing: "0.04em",
            color: "#1B2A4A",
            textShadow: "0 2px 20px rgba(255,243,214,0.6)",
            animation: "splashRise 1.1s ease both",
          }}
        >
          자연을 품은 하루
        </div>
        <div
          style={{
            marginTop: "14px",
            fontSize: "clamp(13px, 2.4vw, 18px)",
            color: "#2C3E2C",
            opacity: 0.9,
            animation: "splashRise 1.1s ease 0.25s both",
          }}
        >
          오늘의 기록을 시작합니다
        </div>
      </div>

      <style>{`
        @keyframes splashRise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
