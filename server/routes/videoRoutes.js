import express from 'express';
import {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  updateVideoType,
  deleteVideo,
  syncChannelVideos
} from '../controllers/videoController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// 모든 영상 조회 (공개용 - 인증 불필요)
router.get('/', getAllVideos);

// ID로 영상 조회 (공개용)
router.get('/:id', getVideoById);

// 관리자 전용 라우트
// 유튜브 채널 동기화 (관리자만)
router.post('/admin/sync', verifyToken, verifyAdmin, syncChannelVideos);

// 영상 생성 (관리자만)
router.post('/admin', verifyToken, verifyAdmin, createVideo);

// 영상 타입만 수정 (관리자만)
router.patch('/admin/:id/type', verifyToken, verifyAdmin, updateVideoType);

// 영상 수정 (관리자만)
router.put('/admin/:id', verifyToken, verifyAdmin, updateVideo);

// 영상 삭제 (관리자만)
router.delete('/admin/:id', verifyToken, verifyAdmin, deleteVideo);

export default router;

