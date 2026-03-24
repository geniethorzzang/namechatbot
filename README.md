# NameChatBot

> 개인 정보 + 스타일 취향을 바탕으로  
> **한국어 닉네임 3개 + 영어 아이디 3개**를 생성하는 챗봇형 네이밍 앱

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4)
![OpenAI](https://img.shields.io/badge/OpenAI-API-412991)

## 왜 이 프로젝트인가?

닉네임 생성기는 많지만, 대부분 단순 조합 수준입니다.  
`NameChatBot`은 사용자의 맥락(취미, 지역, 성격 등)을 대화형으로 수집하고, 원하는 분위기를 반영해 **더 기억에 남는 후보**를 제안합니다.

---

## 목차

- [핵심 기능](#핵심-기능)
- [사용 흐름](#사용-흐름)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [빠른 시작](#빠른-시작)
- [환경 변수](#환경-변수)
- [스크립트](#스크립트)
- [배포 (Vercel)](#배포-vercel)
- [트러블슈팅](#트러블슈팅)
- [로드맵](#로드맵)

---

## 핵심 기능

### 1) 챗봇형 입력 UX
- 사용자 정보를 질문형으로 순차 수집
- 입력 항목: 이름, 취미, 반려동물, 고향, 음식, 생일, 외모/분위기, 성격

### 2) 스타일 칩 다중 선택
- `러블리`, `웃긴`, `유치`, `트렌디`, `쿨/시크`, `다크`
- 여러 개 동시 선택 가능
- 선택 값이 시스템 프롬프트에 직접 반영

### 3) 결과 품질 & 구조화
- 한국어 3개 + 영어 3개, 총 6개 제안
- 각 닉네임에 1줄 이유 제공
- 서버에서 JSON 스키마 검증 후 클라이언트 렌더링

### 4) 생산성 기능
- 카드별 즉시 복사
- 히스토리/즐겨찾기 로컬 저장(`localStorage`)
- 한국어/영어 UI 토글

---

## 사용 흐름

1. 스타일 선택  
2. 챗봇 질문에 답변 입력  
3. `/api/chat`에서 OpenAI 호출  
4. JSON 응답 검증(Zod)  
5. 결과 카드 렌더 + 히스토리 저장

---

## 기술 스택

- **Framework**: Next.js (App Router)
- **UI**: Tailwind CSS, shadcn/ui
- **State**: React State + Custom Hook (`useLocalStorageState`)
- **API**: OpenAI SDK (`openai`)
- **Validation**: Zod
- **Language**: TypeScript

---

## 아키텍처

```txt
Client (app/page.tsx)
  ├─ 챗봇 UI / 스타일 선택 / 결과 카드
  ├─ localStorage 히스토리/즐겨찾기
  └─ POST /api/chat

Server (app/api/chat/route.ts)
  ├─ 요청 스키마 검증 (zod)
  ├─ OpenAI Chat Completions 호출
  ├─ 결과 JSON 스키마 검증 (zod)
  └─ 클라이언트에 suggestions 반환
```

핵심 설계 포인트:
- API 키는 서버 전용 (`OPENAI_API_KEY`)
- 출력은 JSON 강제 + 스키마 검증으로 파싱 안정성 확보

---

## 빠른 시작

```bash
npm install
npm run dev
```

브라우저 접속:
- `http://localhost:3000`
- 또는 `http://127.0.0.1:3000`

> 개발 중에는 `172.x.x.x` 같은 Network 주소 대신 `localhost` 사용을 권장합니다.

---

## 환경 변수

루트에 `.env.local` 생성:

```env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

보안 원칙:
- 키는 절대 클라이언트에 노출하지 않음
- 서버 라우트(`/api/chat`)에서만 외부 API 호출

---

## 스크립트

```bash
# 개발 서버 (localhost 고정)
npm run dev

# 개발 서버 (webpack 모드)
npm run dev:webpack

# 프로덕션 빌드 (webpack 고정)
npm run build

# 프로덕션 실행
npm run start

# 린트
npm run lint
```

---

## 배포 (Vercel)

1. GitHub에 전체 소스 푸시
2. Vercel에서 저장소 Import
3. `Settings > Environment Variables`에 `OPENAI_API_KEY` 등록
4. Deploy

배포 체크리스트:
- Node 20.x (`.nvmrc`, `engines`)
- `package-lock.json` 포함
- 환경 변수 누락 없음

---

## 트러블슈팅

### 1) 버튼이 안 눌릴 때
- 강력 새로고침: `Ctrl + Shift + R`
- 중복 dev 서버 종료 후 재실행
- 콘솔 하이드레이션 경고 확인

### 2) 추천 결과가 비어 있을 때
- `.env.local`의 `OPENAI_API_KEY` 확인
- `/api/chat` 응답 에러 메시지 확인
- 모델 응답 포맷(JSON) 실패 로그 확인

### 3) `ERR_CONNECTION_REFUSED`
- 서버 미실행 상태
- `npm run dev` 후 재접속

### 4) HMR WebSocket 오류
- `localhost`로 접속
- 필요 시 `npm run dev:webpack`

---

## 로드맵

- [ ] 사용자 정의 프롬프트 템플릿 UI
- [ ] 닉네임 필터(금칙어/길이/특수문자 정책)
- [ ] 결과 공유 링크
- [ ] 추천 품질 A/B 테스트

---

프로젝트를 개선하거나 기능 아이디어가 있다면 Issue/PR로 제안해 주세요.
