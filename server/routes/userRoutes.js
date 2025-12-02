import express from 'express';
import {
  getAllUsers,
  getUserById,
  getUserByUserId,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  getUserByToken
} from '../controllers/userController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// 로그인 (다른 라우트보다 먼저 정의)
router.post('/login', loginUser);

// 토큰으로 유저 정보 조회 (인증 필요)
router.get('/me', verifyToken, getUserByToken);

// userId로 유저 조회 (동적 라우트보다 먼저 정의)
router.get('/userId/:userId', getUserByUserId);

// 관리자 전용 라우트
// 모든 유저 조회 (관리자만)
router.get('/admin/all', verifyToken, verifyAdmin, getAllUsers);

// 유저 생성 (관리자만)
router.post('/admin', verifyToken, verifyAdmin, createUser);

// ID로 유저 조회 (관리자만)
router.get('/admin/:id', verifyToken, verifyAdmin, getUserById);

// 유저 수정 (관리자만)
router.put('/admin/:id', verifyToken, verifyAdmin, updateUser);

// 유저 삭제 (관리자만)
router.delete('/admin/:id', verifyToken, verifyAdmin, deleteUser);

// 일반 사용자용 라우트 (기존 호환성 유지)
// 모든 유저 조회
router.get('/', getAllUsers);

// 유저 생성
router.post('/', createUser);

// ID로 유저 조회 (가장 마지막에 정의)
router.get('/:id', getUserById);

// 유저 수정
router.put('/:id', updateUser);

// 유저 삭제
router.delete('/:id', deleteUser);

export default router;

