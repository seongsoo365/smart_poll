# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**Smart Poll** — 2026 북중미 FIFA 월드컵 승패·스코어 예측 게임. Next.js 15 App Router + Supabase 백엔드 기반이며, 관리자가 경기를 관리하고 참가자가 예측을 제출한 뒤 자동 채점하는 구조.

## 개발 명령어

```bash
npm run dev      # 개발 서버 시작 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
```

환경변수 없이 실행 시 Supabase 미설정 배너만 표시되며 앱은 정상 동작함 (`createClientSafe` 패턴으로 graceful degradation).

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
KAKAO_CLIENT_ID=           # 카카오 로그인용
KAKAO_CLIENT_SECRET=
```

## 아키텍처

### 라우트 구조
- `app/(public)/` — 일반 사용자 페이지 (Header + MobileBottomNav 레이아웃)
  - `page.tsx` — 홈: 날짜별 예측 가능 경기 + TOP 3 랭킹
  - `matches/` — 전체 경기 목록 (라운드 탭 필터)
  - `matches/[id]/` — 경기 상세 + 예측 폼 + 예측 통계
  - `rankings/` — 전체 순위표
  - `my-predictions/` — 내 예측 목록
- `app/admin/` — 관리자 페이지 (AdminSidebar 레이아웃, `system_admin` 역할 필수)
  - `matches/` — 경기 목록·등록·수정·결과 입력
  - `users/` — 참가자 승인·역할 관리
  - `scoring/` — 채점 규칙 설정
- `app/auth/` — 인증 라우트
  - `login/` — Google/카카오 소셜 로그인 UI
  - `callback/` — Google OAuth 콜백
  - `kakao/` → `callback/kakao/` — 카카오 커스텀 OAuth 플로우
  - `pending/` — 관리자 승인 대기 페이지
- `app/api/` — REST API Route Handlers
  - `api/predictions` — 예측 제출 (POST)
  - `api/admin/matches` — 경기 CRUD
  - `api/admin/matches/[id]/result` — 결과 입력 + 자동 채점
  - `api/admin/matches/[id]/toggle-prediction` — 예측 개방 토글
  - `api/admin/users/[id]/approve` — 사용자 승인
  - `api/admin/users/[id]/role` — 역할 변경
  - `api/admin/scoring` — 채점 규칙 수정

### Supabase 클라이언트 패턴
- `lib/supabase/server.ts` — 서버 컴포넌트·API Route용
  - `createClient()` — 표준 서버 클라이언트 (환경변수 필수)
  - `createClientSafe()` — 환경변수 미설정 시 `null` 반환 (공개 페이지용)
- `lib/supabase/client.ts` — 클라이언트 컴포넌트용 브라우저 클라이언트

### 인증·권한
- `middleware.ts` — 세션 쿠키 갱신만 담당 (리다이렉트는 layout.tsx에서 처리)
- 관리자 페이지: `app/admin/layout.tsx`에서 `role === 'system_admin'` 검증 후 리다이렉트
- API: 각 Route Handler 내 `requireAdmin()` 헬퍼로 검증
- 일반 참가자: `is_approved === true` 여야 예측 제출 가능

### DB 테이블
- `matches` — 경기 정보 (`is_prediction_open`, `status`, `prediction_locked_at` 포함)
- `predictions` — 사용자 예측 (`user_id, match_id` 복합 유니크 → upsert)
- `user_profiles` — 사용자 프로필 (`role`, `is_approved`, `provider`)
- `scoring_rules` — 채점 규칙 (`winner`, `exact_score` 두 종류)

### 타입
`types/index.ts`에 모든 공유 타입·상수·유틸 함수가 위치:
- `getWinnerFromScore()` — 스코어 → 승무패 변환
- `isMatchLocked()` — 예측 마감 여부 (기본: kickoff -1시간)
- `formatKickoffKST()` — KST 기준 날짜/시간 포맷
- `ROUND_LABELS` — 라운드 한국어 레이블

### 컴포넌트 구조
- `components/ui/` — shadcn/ui 기본 컴포넌트
- `components/layout/` — Header, MobileBottomNav, AdminSidebar, LogoutButton, SetupBanner
- `components/matches/` — MatchCard, PredictionForm, PredictionStats, RoundTabs
- `components/admin/` — MatchForm, ResultForm, ScoringForm, 각종 액션 버튼
- `components/home/` — DateNav (날짜 네비게이터)

### 카카오 OAuth 플로우
Supabase 기본 OAuth를 사용하지 않고 커스텀 구현:
1. `/auth/kakao` — state 생성 + 쿠키 저장 후 카카오 인증 URL로 리다이렉트
2. `/auth/callback/kakao` — code 수신 → 카카오 토큰 교환 → Supabase 세션 생성
3. `/auth/kakao/complete` — 닉네임 등록 (첫 로그인 시)

### 스코어링
결과 입력(`/api/admin/matches/[id]/result`) 시 해당 경기의 모든 예측을 일괄 채점:
- 승무패 정답: `scoring_rules`의 `winner` 점수
- 정확한 스코어: `winner` + `exact_score` 합산
