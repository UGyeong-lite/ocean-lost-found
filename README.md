# 오션 lost and found

## 실행

이 폴더에서 `npm install` 후 `npm run dev`를 실행하세요. `npm run build`는 GitHub Pages에 공개할 파일을 `docs/`에 만듭니다. 이 폴더를 포함해 커밋하고 `main` 브랜치에 푸시하면 사이트가 갱신됩니다.

사이트: https://ugyeong-lite.github.io/ocean-lost-found/

휴대폰에서 위 HTTPS 주소를 열어 사진 촬영과 분실물 확인을 할 수 있습니다. 별도 앱 설치는 필요하지 않습니다.

## 교사 코드

학생은 로그인 없이 목록을 볼 수 있습니다. 교사는 **교사 로그인**에서 학교가 안내한 공통 코드를 입력합니다. 코드는 서버에서 확인하며, 새로고침하면 다시 입력해야 합니다. 코드가 알려진 사람은 누구나 물품을 등록하거나 삭제할 수 있으므로 교사에게만 전달하세요. 교사 코드를 변경하려면 Supabase 관리자에게 요청하세요.

사진과 분실물 설명은 학생을 포함한 모든 방문자에게 공개됩니다. 이름표, 학생증, 연락처 등 개인 정보가 노출되지 않도록 촬영 및 입력 전에 확인하세요. 반환된 물건은 교사가 **반환 후 삭제**로 삭제합니다.

앱은 기존 Supabase 프로젝트의 `lost_items` 테이블과 `lost_and_found` 버킷 및 `ocean-teacher` Edge Function을 사용합니다. Supabase URL 및 공개 키를 변경할 때는 `.env.local`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 설정하세요. 서비스 역할 키는 브라우저에 절대 넣지 마세요.
