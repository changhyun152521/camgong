import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '제목은 필수입니다'],
    trim: true
  },
  content: {
    type: String,
    required: [true, '내용은 필수입니다'],
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '작성자는 필수입니다']
  },
  authorName: {
    type: String,
    required: [true, '작성자명은 필수입니다'],
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    required: [true, '전화번호는 필수입니다'],
    trim: true
  },
  status: {
    type: String,
    enum: ['답변대기', '답변완료'],
    default: '답변대기'
  },
  views: {
    type: Number,
    default: 0
  },
  answer: {
    type: String,
    trim: true,
    default: null
  },
  answeredAt: {
    type: Date,
    default: null
  },
  answeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// 생성일 기준 최신순 정렬 인덱스
inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ status: 1 });

const Inquiry = mongoose.model('Inquiry', inquirySchema);

export default Inquiry;

