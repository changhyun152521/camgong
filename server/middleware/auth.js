import jwt from 'jsonwebtoken';

// JWT 토큰 검증 미들웨어
export const verifyToken = (req, res, next) => {
  try {
    // 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '토큰이 제공되지 않았습니다.'
      });
    }
    
    // "Bearer " 접두사 제거
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '토큰이 제공되지 않았습니다.'
      });
    }
    
    // 토큰 검증
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
      console.error('JWT_SECRET이 환경 변수에 설정되지 않았습니다.');
      return res.status(500).json({
        success: false,
        message: '서버 설정 오류가 발생했습니다.'
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 요청 객체에 디코딩된 토큰 정보 추가
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: '토큰 검증 중 오류가 발생했습니다.'
    });
  }
};

// 관리자 권한 체크 미들웨어
export const verifyAdmin = (req, res, next) => {
  try {
    // verifyToken 미들웨어가 먼저 실행되어야 함
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }
    
    // 관리자 권한 확인
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '권한 확인 중 오류가 발생했습니다.'
    });
  }
};

