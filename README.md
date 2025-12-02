# 캠핑공작소 (Camping Workshop)

캠핑 관련 동영상 및 쇼츠를 제공하는 웹 애플리케이션입니다.

## 프로젝트 구조

```
camping/
├── client/          # React 프론트엔드 (Vercel 배포)
├── server/          # Node.js 백엔드 (Heroku 배포)
└── README.md
```

## 기술 스택

### Frontend
- React 18
- React Router DOM
- Vite
- Axios

### Backend
- Node.js
- Express
- MongoDB (Mongoose)
- JWT 인증
- YouTube Data API

## 로컬 개발 환경 설정

### Prerequisites
- Node.js (v18 이상)
- MongoDB (로컬 또는 Atlas)

### Backend 설정

1. `server` 폴더로 이동
```bash
cd server
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
- `.env` 파일 생성
- `env.example` 파일을 참고하여 필요한 환경 변수 설정

4. 서버 실행
```bash
npm run dev
```

### Frontend 설정

1. `client` 폴더로 이동
```bash
cd client
```

2. 의존성 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm run dev
```

## 배포

### Heroku (Backend)
1. Heroku CLI 설치 및 로그인
2. `server` 폴더에서 Heroku 앱 생성
3. 환경 변수 설정 (Heroku Dashboard 또는 CLI)
4. Git push

### Vercel (Frontend)
1. Vercel 계정 연결
2. GitHub 저장소 연결
3. `client` 폴더를 루트로 설정
4. 환경 변수 설정 (Vercel Dashboard)
5. 배포

## 주요 기능

- 사용자 인증 (회원가입, 로그인)
- 동영상 및 쇼츠 관리
- 문의사항 게시판
- 관리자 페이지

## 라이선스

ISC

