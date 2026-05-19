# ADR-0001: HTML dashboard as project context document

- **Status**: Accepted
- **Date**: 2026-05-19

## Context

프로젝트가 multi-language(TypeScript + Python), multi-phase(웹 → 백엔드 → geometry → Rhino), 그리고 협업/보고 대상이 명확하다(상급자, 다른 작업자, 그리고 다음 세션의 Claude 자신). 기존에 사용하던 markdown 메모리 파일은 다음 한계가 있다:

1. 시각화가 약함 — 아키텍처/데이터 흐름을 텍스트만으로 설명하기 어려움
2. GitHub에서 보지 않는 한 별도 도구 필요
3. Claude의 메모리 디렉토리(`~/.claude/projects/.../memory/`)는 repo 외부 → 다른 작업자는 보지 못함

협업/보고/자기 참조를 모두 만족하면서 별도 인프라(Notion/Confluence/문서 빌드 시스템)를 도입하지 않는 안이 필요.

## Decision

**단일 자기완결 HTML 파일 `docs/dashboard.html`을 프로젝트의 시각 보고서이자 컨텍스트 문서로 채택한다.** Mermaid 다이어그램을 CDN으로 로드해 빌드 단계 없이 브라우저로 바로 열린다. 보조 markdown 파일들(`architecture.md`, `grading.md`, `seoul-api.md`, `roadmap.md`, `STATUS.md`)이 같은 내용을 텍스트로도 제공해 다음 용도를 동시에 만족한다:

- **상급자/협업자**: dashboard.html을 더블클릭하거나 GitHub Pages URL로 한 페이지에서 전체 파악
- **GitHub 리뷰어**: markdown은 GitHub에서 Mermaid 코드펜스로 그대로 렌더링되므로 PR에서도 다이어그램 확인 가능
- **Claude 세션 복원**: markdown을 Read 도구로 읽어 컨텍스트 빠르게 복구. dashboard.html도 읽을 수 있음.
- **diff/검색**: markdown 변경 추적이 용이

dashboard.html은 외부 fetch(`./grading.md` 등)를 하지 않는다 — `file://`에서 차단됨. Mermaid 라이브러리만 CDN에서 로드.

## Consequences

**긍정**:
- 인프라 0 (정적 파일 + CDN 1개)
- 협업·보고·셀프참조 단일 소스
- repo와 함께 버전 관리됨
- Claude 자신의 메모리(`~/.claude/.../memory/`)는 슬림하게 유지 가능 → 프로젝트 사실은 repo, 사용자 선호/공통 지식만 memory

**부정**:
- dashboard.html과 보조 markdown 사이 내용 중복 → 수동 동기 필요 (개정 빈도가 낮은 항목만 dashboard에 인라인하여 부담 최소화)
- Mermaid 다크 테마 자동 전환 미지원 (light 고정)
- GitHub Pages에서 보려면 `Settings → Pages → Source: /docs`로 활성화 필요 (선택)

## Related

- ADR-0003 (threshold-duplication) — 같은 패턴이 코드와 dashboard §5 사이에도 적용
- ~/.claude/projects/.../memory/MEMORY.md 의 `project_docs_location` 엔트리
