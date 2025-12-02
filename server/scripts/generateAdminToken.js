import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import connectDB from '../config/database.js';

// 환경 변수 로드
dotenv.config();

// 데이터베이스 연결
connectDB();

const generateAdminToken = async () => {
  try {
    // 관리자 계정 찾기
    const admin = await User.findOne({ userType: 'admin' });
    
    if (!admin) {
      console.log('❌ 관리자 계정을 찾을 수 없습니다.');
      console.log('💡 관리자 계정을 먼저 생성해주세요.');
      console.log('\n관리자 계정 생성 방법:');
      console.log('1. 회원가입 API를 사용하여 userType을 "admin"으로 설정');
      console.log('2. 또는 데이터베이스에서 직접 사용자의 userType을 "admin"으로 변경');
      process.exit(1);
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET이 환경 변수에 설정되지 않았습니다.');
      process.exit(1);
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        userId: admin.userId,
        id: admin._id.toString(),
        userType: admin.userType
      },
      JWT_SECRET,
      { expiresIn: '7d' } // 7일 동안 유효
    );

    console.log('\n✅ 관리자 토큰이 생성되었습니다!\n');
    console.log('📋 관리자 정보:');
    console.log(`   - 사용자 ID: ${admin.userId}`);
    console.log(`   - 이름: ${admin.name}`);
    console.log(`   - 권한: ${admin.userType}\n`);
    console.log('🔑 토큰:');
    console.log(token);
    console.log('\n💡 사용 방법:');
    console.log('   API 요청 시 헤더에 다음을 추가하세요:');
    console.log(`   Authorization: Bearer ${token}`);
    console.log('\n⚠️  보안 주의: 이 토큰을 안전하게 보관하세요!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 토큰 생성 중 오류 발생:', error);
    process.exit(1);
  }
};

// 스크립트 실행
generateAdminToken();

