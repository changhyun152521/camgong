import express from 'express';
import userRoutes from './userRoutes.js';
import videoRoutes from './videoRoutes.js';
import inquiryRoutes from './inquiryRoutes.js';

const router = express.Router();

// 예시 라우트
router.get('/test', (req, res) => {
  res.json({ message: 'API route is working!' });
});

// 유저 라우트
router.use('/users', userRoutes);

// 영상 라우트
router.use('/videos', videoRoutes);

// 문의사항 라우트
router.use('/inquiries', inquiryRoutes);

export default router;

