# 배포 가이드

이 문서는 Heroku (Backend)와 Vercel (Frontend)에 배포하는 방법을 안내합니다.

## 사전 준비

1. GitHub 저장소 생성 및 코드 푸시
2. Heroku 계정 생성
3. Vercel 계정 생성

## Backend 배포 (Heroku)

### 1. Heroku CLI 설치 및 로그인

```bash
# Heroku CLI 설치 (이미 설치되어 있다면 생략)
# https://devcenter.heroku.com/articles/heroku-cli

# Heroku 로그인
heroku login
```

### 2. Heroku 앱 생성

```bash
cd server
heroku create your-app-name
```

### 3. MongoDB Atlas 설정

1. MongoDB Atlas에서 클러스터 생성
2. Database Access에서 사용자 생성
3. Network Access에서 IP 주소 허용 (0.0.0.0/0로 모든 IP 허용 가능)
4. Connection String 복사

### 4. Heroku 환경 변수 설정

```bash
# Heroku Dashboard에서 설정하거나 CLI로 설정
heroku config:set MONGODB_ATLAS_URL="your-mongodb-atlas-connection-string"
heroku config:set JWT_SECRET="your-jwt-secret-key"
heroku config:set YOUTUBE_API_KEY="your-youtube-api-key"
heroku config:set PORT=5000
```

또는 Heroku Dashboard에서:
1. 앱 선택 → Settings → Config Vars
2. 필요한 환경 변수 추가

### 5. 코드 배포

```bash
# Git 저장소에 Heroku remote 추가 (이미 생성 시 자동 추가됨)
git remote -v

# 코드 푸시
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main

# 또는 master 브랜치인 경우
git push heroku master
```

### 6. 배포 확인

```bash
# 로그 확인
heroku logs --tail

# 앱 열기
heroku open
```

## Frontend 배포 (Vercel)

### 1. Vercel CLI 설치 및 로그인

```bash
# Vercel CLI 설치
npm i -g vercel

# Vercel 로그인
vercel login
```

### 2. vercel.json 수정

`client/vercel.json` 파일에서 Heroku 앱 URL을 실제 URL로 변경:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://YOUR_HEROKU_APP_NAME.herokuapp.com/api/$1"
    }
  ]
}
```

### 3. Vercel Dashboard를 통한 배포

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. "Add New Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Root Directory**: `client` 선택
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Environment Variables 추가:
   - `VITE_API_URL`: `https://YOUR_HEROKU_APP_NAME.herokuapp.com`
6. "Deploy" 클릭

### 4. Vercel CLI를 통한 배포

```bash
cd client
vercel
```

### 5. 환경 변수 설정 (선택사항)

만약 프론트엔드에서 환경 변수가 필요하다면:

```bash
vercel env add VITE_API_URL
# 또는 Vercel Dashboard에서 설정
```

## 배포 후 확인 사항

### Backend (Heroku)
- [ ] API 엔드포인트가 정상 작동하는지 확인
- [ ] MongoDB 연결 확인
- [ ] 환경 변수 설정 확인

### Frontend (Vercel)
- [ ] 프론트엔드가 정상 로드되는지 확인
- [ ] API 요청이 Heroku로 올바르게 프록시되는지 확인
- [ ] 환경 변수 설정 확인

## 문제 해결

### Heroku 배포 오류
- `Procfile`이 `server` 폴더에 있는지 확인
- `package.json`에 `start` 스크립트가 있는지 확인
- 로그 확인: `heroku logs --tail`

### Vercel 배포 오류
- `vercel.json`의 Heroku URL이 올바른지 확인
- 빌드 로그 확인 (Vercel Dashboard)
- 환경 변수 설정 확인

### CORS 오류
- Heroku의 `server/index.js`에서 CORS 설정 확인
- Vercel 도메인이 허용 목록에 있는지 확인

## 참고사항

- Heroku는 무료 플랜에서 30분 동안 활동이 없으면 앱이 sleep 상태가 됩니다
- Vercel은 무료 플랜에서도 좋은 성능을 제공합니다
- 환경 변수는 절대 GitHub에 커밋하지 마세요

