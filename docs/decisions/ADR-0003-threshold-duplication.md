# ADR-0003: Threshold duplication between grade.ts and dashboard.html

- **Status**: Accepted
- **Date**: 2026-05-19

## Context

수질 등급 threshold 표(별표 1)는 두 곳에서 동일해야 한다:
1. `apps/web/src/lib/grade.ts`의 `THRESHOLDS` 상수 (런타임 등급 계산)
2. `docs/dashboard.html`의 §5 표 (사람이 읽는 기준표)

이상적으로는 단일 출처를 두고 양쪽이 import 하는 것이 옳다. 후보:

- **Option A**: `shared/grade-thresholds.json` 두고 양쪽이 fetch/import
- **Option B**: 수동 중복, `docs/grading.md`를 출처 문서로 명시
- **Option C**: TypeScript에서 JSON 빌드 시 dashboard.html로 inject (Vite 플러그인)

Option A는 깔끔하지만 dashboard.html이 `file://`로 열릴 때 `fetch('../shared/grade-thresholds.json')`이 Chrome에서 차단된다(CORS 유사 보안 정책, `--allow-file-access-from-files` 플래그 필요). GitHub Pages 환경에서는 가능하지만 더블클릭 사용성을 잃는다.

Option C는 빌드 단계 도입 — dashboard.html의 "자기완결, 빌드 없음" 원칙(ADR-0001)을 깨뜨림.

## Decision

**Option B (수동 중복) 채택.** 단, drift 방지 장치를 둔다:

1. `docs/grading.md`를 **유일한 출처 문서**로 지정. 표 변경은 항상 grading.md에서 시작.
2. `grade.ts`의 `THRESHOLDS` 상수 위에 주석: "별표 1 — 본 값은 `docs/grading.md`와 1:1 일치해야 함. 개정 시 ADR-0003 참조."
3. `dashboard.html` §5에도 같은 주석을 HTML 코멘트로.
4. 시행규칙 개정 주기 = 수년(법령 개정 사이클) → drift 위험은 실질적으로 낮음.

## Consequences

**긍정**:
- dashboard.html이 빌드 없이 file:// 더블클릭으로 열림 — 비기술자(상급자)도 접근 가능
- Vite 의존성 무수정
- 코드 한 곳, 문서 한 곳 — 검색이 명확

**부정**:
- 두 곳을 수동 동기. 잊으면 drift 발생. 주석과 grading.md 출처 명시로 완화하지만 100%는 아님
- 개정 발생 시 PR review에서 3 파일(`grading.md`, `grade.ts`, `dashboard.html`) 모두 변경됐는지 확인 필요

## Deferred alternative

Phase 2에서 `apps/api` (FastAPI)가 도입되어 dashboard도 동적 페이지로 전환되면, threshold를 `shared/grade-thresholds.json`에 두고 양쪽이 fetch — Option A 로 전환 가능. 그 시점에 이 ADR을 superseded 표시.

## Related

- ADR-0001 (HTML dashboard) — file:// 자기완결 제약의 기원
- ADR-0002 (worst-of grading) — 데이터 모델 측면 결정
