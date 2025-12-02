import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  youtubeUrl: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        // 유튜브 URL 형식 검증
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
      },
      message: '유효한 유튜브 URL을 입력해주세요.'
    }
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  videoType: {
    type: String,
    enum: ['자작솜씨', '자작강의', '기타'],
    required: true,
    default: '자작솜씨'
  },
  videoFormat: {
    type: String,
    enum: ['동영상', '쇼츠'],
    required: true,
    default: '동영상'
  },
  publishedAt: {
    type: Date,
    default: null
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Video = mongoose.model('Video', videoSchema);

export default Video;

