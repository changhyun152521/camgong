import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import '../App.css';
import './VideoListPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VideoPlayer from '../components/VideoPlayer';
import api from '../utils/api';

const VideoListPage = () => {
  const { type } = useParams(); // '자작솜씨' 또는 '자작강의'
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const videosPerPage = 4;

  // URL 디코딩
  const decodedType = type ? decodeURIComponent(type) : '';

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      // 모든 영상 가져오기
      const response = await api.get('/videos?limit=1000');
      if (response.data.success) {
        const allVideos = response.data.data;
        
        // 타입에 맞는 동영상만 필터링 (videoFormat === '동영상')
        const filteredVideos = allVideos.filter(video => 
          video.videoType === decodedType && video.videoFormat === '동영상'
        );
        
        // 페이지네이션
        const startIndex = (currentPage - 1) * videosPerPage;
        const endIndex = startIndex + videosPerPage;
        const paginatedVideos = filteredVideos.slice(startIndex, endIndex);
        
        setVideos(paginatedVideos);
        setTotalPages(Math.ceil(filteredVideos.length / videosPerPage));
      }
    } catch (error) {
      console.error('영상 목록 로드 오류:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [decodedType, currentPage, videosPerPage]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVideoClick = (video) => {
    // YouTube URL에서 video ID 추출
    const videoId = video.youtubeUrl.match(/[?&]v=([^&]+)/)?.[1] || 
                   video.youtubeUrl.match(/youtu\.be\/([^?]+)/)?.[1];
    if (videoId) {
      setSelectedVideo({ videoId, title: video.title });
    }
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-number ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }
    
    return pages;
  };

  const pageTitle = decodedType === '자작솜씨' ? '솜씨영상' : '강의영상';

  // 업로드 시간 계산 함수
  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    
    const now = new Date();
    const uploadDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - uploadDate) / 1000);
    
    if (diffInSeconds < 60) {
      return '방금 전';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}주 전`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}개월 전`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}년 전`;
  };

  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        <section className="video-list-section">
          <div className="video-list-container">
            <div className="video-list-title">
              <div className="video-list-title-icon-wrapper">
                {decodedType === '자작솜씨' ? (
                  <svg className="video-list-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                ) : (
                  <svg className="video-list-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    <line x1="8" y1="7" x2="18" y2="7"></line>
                    <line x1="8" y1="12" x2="18" y2="12"></line>
                  </svg>
                )}
              </div>
              <h1>{pageTitle}</h1>
            </div>

            {loading ? (
              <div className="video-loading">영상을 불러오는 중...</div>
            ) : videos.length === 0 ? (
              <div className="video-empty">등록된 동영상이 없습니다.</div>
            ) : (
              <>
                <div className="video-list-grid">
                  {videos.map((video) => {
                    const videoId = video.youtubeUrl.match(/[?&]v=([^&]+)/)?.[1] || 
                                   video.youtubeUrl.match(/youtu\.be\/([^?]+)/)?.[1];
                    return (
                      <div 
                        key={video._id}
                        className="video-list-card"
                        onClick={() => handleVideoClick(video)}
                      >
                        <div className="video-list-thumbnail">
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title}
                            className="video-list-thumbnail-image"
                            onError={(e) => {
                              if (videoId) {
                                e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                              }
                            }}
                          />
                          <div className="video-list-play-overlay">
                            <svg className="video-list-play-icon" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z"></path>
                            </svg>
                          </div>
                        </div>
                        <div className="video-list-card-content">
                          <h3 className="video-list-card-title">{video.title}</h3>
                          <div className="video-list-card-time">
                            {getTimeAgo(video.publishedAt || video.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="video-list-pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-button"
                    >
                      이전
                    </button>
                    {renderPageNumbers()}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="pagination-button"
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {selectedVideo && (
        <VideoPlayer
          videoId={selectedVideo.videoId}
          title={selectedVideo.title}
          onClose={handleClosePlayer}
        />
      )}

      <Footer />
    </div>
  );
};

export default VideoListPage;

