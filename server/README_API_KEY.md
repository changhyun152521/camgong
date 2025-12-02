# YouTube API 키 설정 가이드

## 1. YouTube Data API 키 발급

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - Google 계정으로 로그인

2. **프로젝트 생성 또는 선택**
   - 상단의 프로젝트 선택 드롭다운 클릭
   - "새 프로젝트" 클릭하여 프로젝트 생성
   - 또는 기존 프로젝트 선택

3. **YouTube Data API v3 활성화**
   - 좌측 메뉴에서 "API 및 서비스" > "라이브러리" 클릭
   - 검색창에 "YouTube Data API v3" 입력
   - "YouTube Data API v3" 선택
   - "사용 설정" 버튼 클릭

4. **API 키 생성**
   - 좌측 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 클릭
   - 상단의 "+ 사용자 인증 정보 만들기" 클릭
   - "API 키" 선택
   - 생성된 API 키 복사

5. **API 키 제한 설정 (보안 강화)**
   - 생성된 API 키 옆의 연필 아이콘 클릭
   - "API 제한사항"에서 "키 제한" 선택
   - "YouTube Data API v3"만 선택
   - "애플리케이션 제한사항"에서 "HTTP 리퍼러(웹사이트)" 선택
   - 저장

## 2. .env 파일에 API 키 추가

1. `server` 디렉토리에 `.env` 파일이 있는지 확인
2. `.env` 파일을 텍스트 에디터로 열기
3. 다음 줄을 찾아서 실제 API 키로 변경:

```
YOUTUBE_API_KEY=여기에_발급받은_API_키_붙여넣기
```

예시:
```
YOUTUBE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 3. 보안 주의사항

✅ **해야 할 일:**
- `.env` 파일은 절대 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함되어 있음)
- API 키를 코드에 직접 작성하지 마세요
- API 키를 다른 사람과 공유하지 마세요

❌ **하지 말아야 할 일:**
- `.env` 파일을 GitHub나 다른 공개 저장소에 업로드하지 마세요
- API 키를 클라이언트 코드에 포함하지 마세요
- API 키를 이메일이나 메신저로 전송하지 마세요

## 4. 서버 재시작

API 키를 추가한 후 서버를 재시작하세요:

```bash
# 서버 디렉토리에서
npm run dev
```

## 5. 테스트

관리자 페이지에서 "채널 동기화" 버튼을 클릭하여 모든 영상이 정상적으로 가져와지는지 확인하세요.

