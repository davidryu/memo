# 날짜별 캘린더 메모장

Vite + React 기반 웹 메모장. 캘린더에서 날짜를 선택해 메모를 작성하고, 엑셀(.xlsx) 파일로 저장/불러오기 할 수 있습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 빌드 (Vercel이 사용하는 것과 동일)

```bash
npm run build
```

`dist/` 폴더에 정적 파일이 생성됩니다. (Vercel 프로젝트의 Output Directory: `dist`)

## Vercel 배포 (memo.eyefeet.com)

이 저장소를 GitHub에 올린 뒤 Vercel 프로젝트에 연결하면,
`vercel.json`에 설정된 대로 `npm run build` → `dist` 를 자동으로 배포합니다.
Vercel 프로젝트의 Domains 설정에서 `memo.eyefeet.com`이 이미 연결되어 있다면
`main` 브랜치에 push할 때마다 자동으로 재배포됩니다.
