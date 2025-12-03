import Inquiry from '../models/Inquiry.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// 모든 문의사항 조회 (최신순, 페이지네이션 지원)
export const getAllInquiries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // MongoDB 연결 확인
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB 연결이 끊어졌습니다');
      return res.status(500).json({
        success: false,
        error: '데이터베이스 연결 오류가 발생했습니다'
      });
    }

    const totalInquiries = await Inquiry.countDocuments();
    const totalPages = Math.ceil(totalInquiries / limit);

    const inquiries = await Inquiry.find()
      .populate({
        path: 'author',
        select: 'name userId userType',
        strictPopulate: false
      })
      .populate({
        path: 'answeredBy',
        select: 'name userId',
        strictPopulate: false
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: inquiries.length,
      totalCount: totalInquiries,
      totalPages: totalPages,
      currentPage: page,
      data: inquiries
    });
  } catch (error) {
    console.error('문의사항 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '문의사항을 가져오는 중 오류가 발생했습니다',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 특정 문의사항 조회
export const getInquiryById = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('author', 'name userId userType')
      .populate('answeredBy', 'name userId');

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: '문의사항을 찾을 수 없습니다'
      });
    }

    // 조회수 증가
    inquiry.views += 1;
    await inquiry.save();

    res.json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 문의사항 ID입니다'
      });
    }
    res.status(500).json({
      success: false,
      error: '문의사항을 가져오는 중 오류가 발생했습니다',
      message: error.message
    });
  }
};

// 새 문의사항 생성 (로그인한 회원만 가능)
export const createInquiry = async (req, res) => {
  try {
    const { title, content, phone } = req.body;
    const userId = req.user?._id || req.user?.id;

    // 인증 확인
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다'
      });
    }

    // 필수 필드 검증
    if (!title || !content || !phone) {
      return res.status(400).json({
        success: false,
        error: '제목, 내용, 전화번호는 필수입니다'
      });
    }

    // 작성자 정보 가져오기
    const author = await User.findById(userId);
    if (!author) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다'
      });
    }

    // 이메일은 작성자의 정보에서 가져오거나 빈 문자열로 설정
    // (필드가 있지만 필수는 아님)
    const email = author.email || '';

    // 문의사항 생성
    const inquiry = new Inquiry({
      title,
      content,
      author: userId,
      authorName: author.name || author.userId,
      email,
      phone,
      status: '답변대기'
    });

    const savedInquiry = await inquiry.save();

    res.status(201).json({
      success: true,
      data: savedInquiry
    });
  } catch (error) {
    console.error('문의사항 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '문의사항을 생성하는 중 오류가 발생했습니다',
      message: error.message
    });
  }
};

// 문의사항 답변 작성/수정 (관리자만)
export const updateInquiryAnswer = async (req, res) => {
  try {
    const { answer } = req.body;
    const userId = req.user?._id || req.user?.id;

    // 관리자 권한 확인
    if (!req.user || req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '관리자만 답변을 작성할 수 있습니다'
      });
    }

    if (!answer || answer.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '답변 내용은 필수입니다'
      });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: '문의사항을 찾을 수 없습니다'
      });
    }

    inquiry.answer = answer;
    inquiry.status = '답변완료';
    inquiry.answeredAt = new Date();
    inquiry.answeredBy = userId;

    const updatedInquiry = await inquiry.save();

    res.json({
      success: true,
      data: updatedInquiry
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 문의사항 ID입니다'
      });
    }
    res.status(500).json({
      success: false,
      error: '답변을 작성하는 중 오류가 발생했습니다',
      message: error.message
    });
  }
};

// 문의사항 상태 변경 (관리자만)
export const updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user?._id || req.user?.id;

    // 관리자 권한 확인
    if (!req.user || req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '관리자만 상태를 변경할 수 있습니다'
      });
    }

    if (!['답변대기', '답변완료'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 상태입니다'
      });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: '문의사항을 찾을 수 없습니다'
      });
    }

    inquiry.status = status;
    const updatedInquiry = await inquiry.save();

    res.json({
      success: true,
      data: updatedInquiry
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 문의사항 ID입니다'
      });
    }
    res.status(500).json({
      success: false,
      error: '상태를 변경하는 중 오류가 발생했습니다',
      message: error.message
    });
  }
};

// 문의사항 답변 삭제 (관리자만)
export const deleteInquiryAnswer = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    // 관리자 권한 확인
    if (!req.user || req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '관리자만 답변을 삭제할 수 있습니다'
      });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: '문의사항을 찾을 수 없습니다'
      });
    }

    // 답변 삭제
    inquiry.answer = null;
    inquiry.status = '답변대기';
    inquiry.answeredAt = null;
    inquiry.answeredBy = null;

    const updatedInquiry = await inquiry.save();

    res.json({
      success: true,
      message: '답변이 삭제되었습니다',
      data: updatedInquiry
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 문의사항 ID입니다'
      });
    }
    res.status(500).json({
      success: false,
      error: '답변을 삭제하는 중 오류가 발생했습니다',
      message: error.message
    });
  }
};

// 문의사항 삭제 (작성자 또는 관리자만)
export const deleteInquiry = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userType = req.user?.userType;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다'
      });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: '문의사항을 찾을 수 없습니다'
      });
    }

    // 작성자 또는 관리자만 삭제 가능
    const userIdStr = userId.toString ? userId.toString() : String(userId);
    const authorIdStr = inquiry.author.toString ? inquiry.author.toString() : String(inquiry.author);
    
    if (userType !== 'admin' && authorIdStr !== userIdStr) {
      return res.status(403).json({
        success: false,
        error: '문의사항을 삭제할 권한이 없습니다'
      });
    }

    await Inquiry.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '문의사항이 삭제되었습니다'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 문의사항 ID입니다'
      });
    }
    res.status(500).json({
      success: false,
      error: '문의사항을 삭제하는 중 오류가 발생했습니다',
      message: error.message
    });
  }
};

