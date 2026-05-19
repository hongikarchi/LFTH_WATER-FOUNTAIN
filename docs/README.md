# docs/ — 프로젝트 문서

이 폴더는 프로젝트 시각 보고서(상급자·협업자 대상)이자 Claude 세션 컨텍스트의 단일 출처(single source of truth).

## ⭐ 주요 진입점

**[dashboard.html](./dashboard.html)** — 브라우저에서 더블클릭하거나 GitHub Pages URL로 접속.
한 페이지에서 시스템 아키텍처, 데이터 파이프라인, 모듈 책임, Phase 로드맵, 수질 등급 기준, API 사전, 현재 상태를 모두 확인.

## 보조 텍스트 문서 (GitHub에서 Mermaid 그대로 렌더링)

| 파일 | 내용 |
|------|------|
| [architecture.md](./architecture.md) | 시스템 다이어그램 + 데이터 시퀀스 + 모듈 책임표 |
| [grading.md](./grading.md) | 수질 등급 기준 (별표 1) — **threshold 출처 문서** |
| [seoul-api.md](./seoul-api.md) | Seoul Open API 필드 사전 + 에러 코드 |
| [roadmap.md](./roadmap.md) | Phase 1/1.5/2/3 narrative + Gantt |
| [STATUS.md](./STATUS.md) | 현재 상태 스냅샷 (수동 갱신) |

## Architecture Decision Records (ADR)

| No | 제목 |
|----|------|
| [0001](./decisions/ADR-0001-html-dashboard-as-context-doc.md) | HTML dashboard as project context document |
| [0002](./decisions/ADR-0002-worst-of-composite-grading.md) | Worst-of composite water-quality grading |
| [0003](./decisions/ADR-0003-threshold-duplication.md) | Threshold duplication between grade.ts and dashboard.html |

전체 인덱스: [decisions/README.md](./decisions/README.md)

## 갱신 정책

- **STATUS.md**: 매 작업 세션 종료 시 수동 갱신
- **dashboard.html**: 아키텍처/모듈 책임 변경 시 동기 갱신
- **grading.md**: 별표 1 개정 시 갱신 → `apps/web/src/lib/grade.ts`와 `dashboard.html §5`도 동시 변경 (ADR-0003)
- **ADR**: 새 결정 시 추가, 기존 결정 변경 시 `Status: Superseded by ADR-NNNN` 표기 후 새 ADR 작성
