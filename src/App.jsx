import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { ChevronLeft, ChevronRight, FilePlus2, FolderOpen, Save, CircleDot, NotebookPen, BookHeart } from "lucide-react";
import Splash from "./Splash.jsx";

const pad = (n) => String(n).padStart(2, "0");
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayKey = () => {
  const t = new Date();
  return toKey(t.getFullYear(), t.getMonth(), t.getDate());
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// 탭(모드)별 테마. 일기장은 밝은 야광연두색 + 글로우.
const THEME = {
  memo: {
    key: "memo",
    label: "메모장",
    unit: "메모",
    accent: "#F0AD5D",
    soft: "rgba(224,164,88,0.18)",
    glow: "none",
    icon: NotebookPen,
    placeholder: "이 날짜의 메모를 입력하세요...",
    file: "memo",
    sheet: "Memo",
  },
  diary: {
    key: "diary",
    label: "일기장",
    unit: "일기",
    accent: "#B6FF3C",              // 밝은 야광연두색
    soft: "rgba(182,255,60,0.16)",
    glow: "0 0 16px rgba(182,255,60,0.55)",
    icon: BookHeart,
    placeholder: "오늘 하루의 일기를 적어보세요...",
    file: "diary",
    sheet: "Diary",
  },
};

export default function CalendarMemo() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [mode, setMode] = useState("memo"); // "memo" | "diary"
  const [notes, setNotes] = useState({});     // 메모장 저장소
  const [diaries, setDiaries] = useState({}); // 일기장 저장소
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const fileInputRef = useRef(null);

  const t = THEME[mode];
  const store = mode === "memo" ? notes : diaries;
  const setStore = mode === "memo" ? setNotes : setDiaries;

  // 선택 날짜 또는 탭이 바뀌면 해당 저장소의 내용으로 draft 동기화
  useEffect(() => {
    const s = mode === "memo" ? notes : diaries;
    setDraft(s[selectedKey] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, mode]);

  const flash = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 2200);
  };

  const commitDraft = (key, value) => {
    setStore((prev) => {
      const next = { ...prev };
      if (value && value.trim().length > 0) {
        next[key] = value;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const handleSwitchMode = (nextMode) => {
    if (nextMode === mode) return;
    commitDraft(selectedKey, draft); // 현재 탭 내용 임시 저장
    setMode(nextMode);
  };

  const handleSelectDay = (y, m, d) => {
    const key = toKey(y, m, d);
    commitDraft(selectedKey, draft);
    setSelectedKey(key);
  };

  const handleDraftChange = (v) => {
    setDraft(v);
  };

  const handleBlurSave = () => {
    commitDraft(selectedKey, draft);
  };

  const changeMonth = (delta) => {
    commitDraft(selectedKey, draft);
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const handleNew = () => {
    commitDraft(selectedKey, draft);
    setDraft("");
    setStore((prev) => {
      const next = { ...prev };
      delete next[selectedKey];
      return next;
    });
    flash(`새 ${t.unit}를 시작합니다`);
  };

  const handleSave = () => {
    commitDraft(selectedKey, draft);
    const rows = Object.entries({ ...store, [selectedKey]: draft })
      .filter(([, v]) => v && v.trim().length > 0)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, content]) => ({ Date: date, Content: content }));

    if (rows.length === 0) {
      flash(`저장할 ${t.unit}가 없습니다`);
      return;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 80 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.sheet);
    XLSX.writeFile(wb, `${t.file}_${todayKey()}.xlsx`);
    flash("엑셀 파일로 저장했습니다");
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        const loaded = {};
        rows.forEach((r) => {
          const dateVal = r.Date || r.date || r["날짜"];
          const contentVal = r.Content ?? r.content ?? r["내용"] ?? "";
          if (dateVal) {
            let key = String(dateVal).trim();
            // handle Excel date serials just in case
            if (/^\d+(\.\d+)?$/.test(key)) {
              const parsed = XLSX.SSF.parse_date_code(Number(key));
              if (parsed) key = toKey(parsed.y, parsed.m - 1, parsed.d);
            }
            loaded[key] = String(contentVal);
          }
        });
        setStore(loaded);
        setDraft(loaded[selectedKey] || "");
        flash(`${Object.keys(loaded).length}개의 ${t.unit}를 불러왔습니다`);
      } catch (err) {
        flash("파일을 읽을 수 없습니다");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // Calendar grid calculation
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedDate = new Date(selectedKey + "T00:00:00");
  const hasNoteCount = Object.keys(store).filter(
    (k) => store[k] && store[k].trim().length > 0
  ).length;

  return (
    <>
      {showSplash && <Splash onDone={() => setShowSplash(false)} duration={5000} />}
    <div
      style={{
        minHeight: "100vh",
        background: "#0F1B2D",
        fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
        color: "#E8E6DF",
        padding: "28px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls"
        onChange={handleFile}
        style={{ display: "none" }}
      />

      {/* Tabs: 달력 위에 메모장 / 일기장 */}
      <div style={{ display: "flex", gap: "8px" }}>
        <TabButton
          theme={THEME.memo}
          active={mode === "memo"}
          onClick={() => handleSwitchMode("memo")}
        />
        <TabButton
          theme={THEME.diary}
          active={mode === "diary"}
          onClick={() => handleSwitchMode("diary")}
        />
      </div>

      {/* Content row: Calendar + Editor */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
      {/* Left: Calendar panel */}
      <div
        style={{
          flex: "1 1 320px",
          minWidth: "300px",
          background: "#16243A",
          border: "1px solid #2B3E58",
          borderRadius: "6px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "18px",
          }}
        >
          <button
            onClick={() => changeMonth(-1)}
            style={iconBtnStyle}
            aria-label="이전 달"
          >
            <ChevronLeft size={18} color={t.accent} />
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", color: "#7C93B3" }}>
              {viewYear}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: t.accent }}>
              {MONTH_NAMES[viewMonth]}
            </div>
          </div>
          <button
            onClick={() => changeMonth(1)}
            style={iconBtnStyle}
            aria-label="다음 달"
          >
            <ChevronRight size={18} color={t.accent} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "4px",
            marginBottom: "6px",
          }}
        >
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              style={{
                textAlign: "center",
                fontSize: "11px",
                color: i === 0 ? "#D97757" : "#7C93B3",
                paddingBottom: "6px",
              }}
            >
              {w}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "4px",
          }}
        >
          {cells.map((d, idx) => {
            if (d === null) return <div key={"e" + idx} />;
            const key = toKey(viewYear, viewMonth, d);
            const isSelected = key === selectedKey;
            const isToday = key === todayKey();
            const hasNote = !!(store[key] && store[key].trim());
            const dow = (firstDay + d - 1) % 7;
            return (
              <button
                key={key}
                onClick={() => handleSelectDay(viewYear, viewMonth, d)}
                style={{
                  position: "relative",
                  aspectRatio: "1 / 1",
                  border: isSelected ? `1px solid ${t.accent}` : "1px solid transparent",
                  background: isSelected
                    ? t.soft
                    : isToday
                    ? "rgba(124,147,179,0.15)"
                    : "transparent",
                  boxShadow: isSelected ? t.glow : "none",
                  borderRadius: "5px",
                  color: dow === 0 ? "#D97757" : "#E8E6DF",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {d}
                {hasNote && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "3px",
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: t.accent,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "18px",
            paddingTop: "14px",
            borderTop: "1px dashed #2B3E58",
            fontSize: "11px",
            color: "#7C93B3",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <CircleDot size={12} color={t.accent} />
          기록된 {t.unit} {hasNoteCount}건
        </div>
      </div>

      {/* Right: Editor panel */}
      <div
        style={{
          flex: "2 1 420px",
          minWidth: "320px",
          background: "#16243A",
          border: `1px solid ${mode === "diary" ? t.accent : "#2B3E58"}`,
          boxShadow: mode === "diary" ? t.glow : "none",
          borderRadius: "6px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          transition: "border-color 0.25s ease, box-shadow 0.25s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "14px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "#7C93B3", letterSpacing: "0.1em" }}>
              {t.label} · 선택된 날짜
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: t.accent }}>
              {selectedKey}
              <span style={{ fontSize: "13px", color: "#7C93B3", marginLeft: "10px" }}>
                {WEEKDAYS[selectedDate.getDay()]}요일
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <ActionButton onClick={handleNew} icon={<FilePlus2 size={15} />} label="새로만들기" accent={t.accent} />
            <ActionButton onClick={handleLoadClick} icon={<FolderOpen size={15} />} label="불러오기" accent={t.accent} />
            <ActionButton onClick={handleSave} icon={<Save size={15} />} label="저장하기" accent={t.accent} primary />
          </div>
        </div>

        <textarea
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          onBlur={handleBlurSave}
          placeholder={t.placeholder}
          style={{
            flex: 1,
            minHeight: "360px",
            resize: "vertical",
            background: "#0F1B2D",
            border: `1px solid ${mode === "diary" ? t.accent : "#2B3E58"}`,
            borderRadius: "5px",
            color: "#E8E6DF",
            fontFamily: "inherit",
            fontSize: "14px",
            lineHeight: 1.6,
            padding: "16px",
            outline: "none",
            transition: "border-color 0.25s ease",
          }}
        />

        <div
          style={{
            marginTop: "12px",
            fontSize: "12px",
            color: status ? t.accent : "#4C5F7A",
            height: "16px",
          }}
        >
          {status || `${t.unit}는 날짜를 벗어나면 자동 임시 저장되며, '저장하기'를 눌러야 엑셀 파일로 내보내집니다.`}
        </div>
      </div>
      </div>
    </div>
    </>
  );
}

function TabButton({ theme, active, onClick }) {
  const Icon = theme.icon;
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "11px 24px",
        fontSize: "14px",
        fontWeight: 700,
        fontFamily: "inherit",
        borderRadius: "8px",
        cursor: "pointer",
        border: `1px solid ${active ? theme.accent : "#2B3E58"}`,
        background: active ? theme.soft : "transparent",
        color: active ? theme.accent : "#7C93B3",
        boxShadow: active ? theme.glow : "none",
        transition: "all 0.2s ease",
      }}
    >
      <Icon size={16} color={active ? theme.accent : "#7C93B3"} />
      {theme.label}
    </button>
  );
}

function ActionButton({ onClick, icon, label, primary, accent = "#F0AD5D" }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 12px",
        fontSize: "12px",
        fontFamily: "inherit",
        borderRadius: "5px",
        cursor: "pointer",
        border: primary ? `1px solid ${accent}` : "1px solid #2B3E58",
        background: primary ? accent : "transparent",
        color: primary ? "#0F1B2D" : "#E8E6DF",
        fontWeight: primary ? 700 : 500,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

const iconBtnStyle = {
  background: "transparent",
  border: "1px solid #2B3E58",
  borderRadius: "5px",
  padding: "6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
