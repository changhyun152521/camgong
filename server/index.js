import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/database.js';
import routes from './routes/index.js';
import mongoose from 'mongoose';

// 환경 변수 로드 (현재 파일 위치 기준으로 .env 파일 찾기)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// 환경 변수 로드 확인
console.log('=== 환경 변수 확인 ===');
console.log('PORT:', process.env.PORT || '5000 (기본값)');
console.log('MONGODB_ATLAS_URL:', process.env.MONGODB_ATLAS_URL ? '설정됨' : '설정되지 않음');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '설정됨' : '설정되지 않음');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '설정됨' : '설정되지 않음');
console.log('YOUTUBE_API_KEY:', process.env.YOUTUBE_API_KEY ? `설정됨 (길이: ${process.env.YOUTUBE_API_KEY.length})` : '설정되지 않음');

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결
connectDB();

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'Camping Server API is running!' });
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok',
    database: dbStatus,
    youtubeApiKey: process.env.YOUTUBE_API_KEY ? '설정됨' : '설정되지 않음',
    timestamp: new Date().toISOString()
  });
});

// API 라우트
app.use('/api', routes);

// 에러 핸들링 미들웨어 (모든 라우트 이후에 위치)
app.use((err, req, res, next) => {
  console.error('❌ 서버 오류:', err);
  console.error('  요청 URL:', req.url);
  console.error('  요청 메서드:', req.method);
  console.error('  오류 스택:', err.stack);
  
  // 응답이 이미 전송되었는지 확인
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '서버 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 요청 로깅 미들웨어 (디버깅용)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 404 핸들러
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.url
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});

