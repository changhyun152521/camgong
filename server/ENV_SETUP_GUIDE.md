# .env 파일 설정 가이드

## 문제 해결: YOUTUBE_API_KEY가 설정되지 않음

### 1. .env 파일 위치 확인
`.env` 파일은 `server` 폴더 안에 있어야 합니다:
```
camping/
  └── server/
      └── .env  ← 여기에 있어야 함
```

### 2. .env 파일에 API 키 추가하기

1. `server` 폴더에서 `.env` 파일을 엽니다 (메모장 또는 VS Code 사용)

2. 파일 끝에 다음 줄을 추가합니다:
   ```
   YOUTUBE_API_KEY=여기에_발급받은_API_키_붙여넣기
   ```

3. 예시:
   ```
   YOUTUBE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **중요**: 
   - `=` 앞뒤에 공백 없이 작성
   - 따옴표(`"` 또는 `'`) 사용하지 않음
   - API 키 앞뒤에 공백 없음

### 3. .env 파일 전체 예시

```
# Server Port
PORT=5000

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/camping

# JWT Secret Key
JWT_SECRET=your-secret-key-change-in-production

# YouTube Data API Key
YOUTUBE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. 서버 재시작

`.env` 파일을 수정한 후:
1. 서버를 중지 (터미널에서 `Ctrl + C`)
2. 서버를 다시 시작 (`npm run dev`)

### 5. 확인 방법

서버를 시작하면 다음과 같이 표시되어야 합니다:
```
=== 환경 변수 확인 ===
YOUTUBE_API_KEY: 설정됨 (길이: 39)
```

만약 여전히 "설정되지 않음"이 표시되면:
- `.env` 파일이 `server` 폴더에 있는지 확인
- 파일 이름이 정확히 `.env`인지 확인 (`.env.txt` 아님)
- API 키 앞뒤에 공백이나 따옴표가 없는지 확인
- 서버를 완전히 재시작했는지 확인







