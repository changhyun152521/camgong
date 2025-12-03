import express from 'express';
import {
  getAllInquiries,
  getInquiryById,
  createInquiry,
  updateInquiryAnswer,
  updateInquiryStatus,
  deleteInquiryAnswer,
  deleteInquiry
} from '../controllers/inquiryController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// 모든 문의사항 조회 (공개용 - 인증 불필요)
router.get('/', getAllInquiries);

// ID로 문의사항 조회 (공개용)
router.get('/:id', getInquiryById);

// 문의사항 생성 (로그인한 회원만 가능)
router.post('/', verifyToken, createInquiry);

// 관리자 전용 라우트
// 문의사항 답변 작성/수정 (관리자만)
router.put('/:id/answer', verifyToken, verifyAdmin, updateInquiryAnswer);

// 문의사항 상태 변경 (관리자만)
router.patch('/:id/status', verifyToken, verifyAdmin, updateInquiryStatus);

// 문의사항 답변 삭제 (관리자만)
router.delete('/:id/answer', verifyToken, verifyAdmin, deleteInquiryAnswer);

// 문의사항 삭제 (작성자 또는 관리자만)
router.delete('/:id', verifyToken, deleteInquiry);

export default router;

