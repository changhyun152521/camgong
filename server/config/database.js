import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // MONGODB_ATLAS_URL을 우선 사용, 없으면 로컬 주소 사용
    const mongoURI = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/camping';
    console.log('MongoDB 연결 시도 중...');
    console.log('MongoDB URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // 비밀번호 숨김
    console.log('사용 중인 MongoDB:', process.env.MONGODB_ATLAS_URL ? 'Atlas (MONGODB_ATLAS_URL)' : process.env.MONGODB_URI ? 'MONGODB_URI' : '로컬 (기본값)');
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // 5초 타임아웃
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB 연결 오류:', error.message);
    console.error('오류 상세:', error);
    // 프로덕션에서는 서버를 종료하지 않고 계속 시도
    if (process.env.NODE_ENV === 'production') {
      console.log('프로덕션 모드: MongoDB 재연결을 시도합니다...');
      // 재연결 시도
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

// 연결 이벤트 리스너
mongoose.connection.on('error', (err) => {
  console.error('MongoDB 연결 오류:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB 연결이 끊어졌습니다.');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB 재연결되었습니다.');
});

export default connectDB;

