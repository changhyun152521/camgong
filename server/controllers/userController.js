import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// ==================== 유저 조회 기능 ====================

// 모든 유저 조회 (페이지네이션 지원, 최신순 정렬)
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 전체 유저 수 조회
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    // 데이터베이스에서 유저 조회 (비밀번호 제외, 최신순 정렬, 페이지네이션)
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 }) // 최신순 정렬 (생성일 기준 내림차순)
      .skip(skip)
      .limit(limit)
      .lean();
    
    res.status(200).json({
      success: true,
      count: users.length,
      totalCount: totalUsers,
      totalPages: totalPages,
      currentPage: page,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ID로 유저 조회
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 데이터베이스에서 ID로 유저 조회 (비밀번호 제외)
    const user = await User.findById(id).select('-password');
    
    // 유저 존재 여부 확인
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// userId로 유저 조회
export const getUserByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 데이터베이스에서 userId로 유저 조회 (비밀번호 제외)
    const user = await User.findOne({ userId }).select('-password');
    
    // 유저 존재 여부 확인
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 유저 생성 기능 ====================

// 유저 생성
export const createUser = async (req, res) => {
  try {
    const { userId, password, name, phoneNumber, userType } = req.body;
    
    // 필수 필드 검증 (비즈니스 로직)
    if (!userId || !password || !name) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다. (userId, password, name)'
      });
    }
    
    // userId 중복 확인 (비즈니스 로직)
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 userId입니다.'
      });
    }
    
    // 비밀번호 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 새 유저 객체 생성
    const user = new User({
      userId,
      password: hashedPassword,
      name,
      phoneNumber: phoneNumber || '', // 선택 항목이므로 빈 문자열로 처리
      userType: userType || 'customer'
    });
    
    // 데이터베이스에 저장
    const savedUser = await user.save();
    
    // 비밀번호 제외하고 응답 데이터 준비
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    // MongoDB 중복 키 에러 처리
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 userId입니다.'
      });
    }
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 유저 수정 기능 ====================

// 유저 수정
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, name, phoneNumber, userType } = req.body;
    
    // 업데이트할 데이터 준비 (비즈니스 로직)
    const updateData = {};
    if (password) {
      // 비밀번호 암호화
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }
    if (name) updateData.name = name;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (userType) updateData.userType = userType;
    
    // 업데이트할 데이터가 없는 경우
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '수정할 데이터가 없습니다.'
      });
    }
    
    // 데이터베이스에서 유저 수정
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    // 유저 존재 여부 확인
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 로그인 기능 ====================

// 로그인
export const loginUser = async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    // 필수 필드 검증
    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: '아이디와 비밀번호를 입력해주세요.'
      });
    }
    
    // userId로 유저 찾기
    const user = await User.findOne({ userId });
    
    // 유저가 존재하지 않는 경우
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }
    
    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }
    
    // JWT 토큰 생성
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
      console.error('JWT_SECRET이 환경 변수에 설정되지 않았습니다.');
      return res.status(500).json({
        success: false,
        message: '서버 설정 오류가 발생했습니다.'
      });
    }
    
    const token = jwt.sign(
      { 
        userId: user.userId,
        id: user._id,
        userType: user.userType
      },
      JWT_SECRET,
      { expiresIn: '7d' } // 7일 동안 유효
    );
    
    // 비밀번호 제외하고 응답 데이터 준비
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      success: true,
      message: '로그인 성공',
      token: token,
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 토큰으로 유저 정보 조회 ====================

// 토큰으로 유저 정보 조회
export const getUserByToken = async (req, res) => {
  try {
    console.log('=== 유저 정보 조회 요청 ===');
    console.log('req.user:', req.user);
    
    // 미들웨어에서 검증된 토큰 정보 사용
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증 정보가 없습니다.'
      });
    }
    
    const userId = req.user.id || req.user.userId;
    
    // MongoDB 연결 상태 확인
    const connectionState = mongoose.connection.readyState;
    console.log('MongoDB 연결 상태:', connectionState);
    
    if (connectionState !== 1) {
      console.error('❌ MongoDB 연결 상태:', connectionState);
      return res.status(503).json({
        success: false,
        message: 'MongoDB에 연결되지 않았습니다. 서버를 재시작해주세요.'
      });
    }
    
    console.log('데이터베이스에서 유저 조회 중...');
    // ID로 유저 찾기
    let user;
    if (req.user.id) {
      // MongoDB ObjectId로 조회
      user = await User.findById(req.user.id).select('-password');
    } else {
      // userId로 조회
      user = await User.findOne({ userId: req.user.userId }).select('-password');
    }
    
    // 유저가 존재하지 않는 경우
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.'
      });
    }
    
    console.log('유저 정보 조회 성공');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('❌ 유저 정보 조회 오류:');
    console.error('  오류 메시지:', error.message);
    console.error('  오류 이름:', error.name);
    if (error.stack) {
      console.error('  오류 스택:', error.stack);
    }
    res.status(500).json({
      success: false,
      message: error.message || '유저 정보를 불러오는 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ==================== 유저 삭제 기능 ====================

// 유저 삭제
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 데이터베이스에서 유저 삭제
    const user = await User.findByIdAndDelete(id);
    
    // 유저 존재 여부 확인
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

