import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import '../App.css';
import './VideoPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VideoPlayer from '../components/VideoPlayer';
import api from '../utils/api';

const VideoPage = () => {
  const { type } = useParams(); // '자작솜씨' 또는 '자작강의'
  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentShortIndex, setCurrentShortIndex] = useState(0);
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
        
        // 타입에 맞는 영상 필터링
        const filteredVideos = allVideos.filter(video => 
          video.videoType === decodedType
        );
        
        // 동영상과 쇼츠 분리
        const longVideos = filteredVideos.filter(v => v.videoFormat === '동영상');
        const shortVideos = filteredVideos.filter(v => v.videoFormat === '쇼츠');
        
        // 동영상 페이지네이션
        const startIndex = (currentPage - 1) * videosPerPage;
        const endIndex = startIndex + videosPerPage;
        const paginatedVideos = longVideos.slice(startIndex, endIndex);
        
        setVideos(paginatedVideos);
        setShorts(shortVideos);
        setTotalPages(Math.ceil(longVideos.length / videosPerPage));
      }
    } catch (error) {
      console.error('영상 목록 로드 오류:', error);
      setVideos([]);
      setShorts([]);
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

  const pageTitle = decodedType === '자작솜씨' ? '자작솜씨' : '자작강의';

  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        <section className="video-page-section">
          <div className="video-page-container">
            <div className="video-page-title">
              <h1>{pageTitle}</h1>
            </div>

            {/* 동영상 섹션 */}
            <div className="video-page-videos-section">
              <h2 className="section-subtitle">동영상</h2>
              {loading ? (
                <div className="video-loading">영상을 불러오는 중...</div>
              ) : videos.length === 0 ? (
                <div className="video-empty">등록된 동영상이 없습니다.</div>
              ) : (
                <>
                  <div className="video-grid video-page-grid">
                    {videos.map((video) => (
                      <a 
                        key={video._id}
                        href={video.youtubeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="video-card-link"
                      >
                        <div className="video-card">
                          <div className="video-thumbnail">
                            <img 
                              src={video.thumbnailUrl} 
                              alt={video.title}
                              className="video-thumbnail-image"
                              onError={(e) => {
                                const videoId = video.youtubeUrl.match(/[?&]v=([^&]+)/)?.[1] || 
                                              video.youtubeUrl.match(/youtu\.be\/([^?]+)/)?.[1];
                                if (videoId) {
                                  e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                }
                              }}
                            />
                            <div className="video-play-overlay">
                              <svg className="video-play-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"></path>
                              </svg>
                            </div>
                          </div>
                          <h3 className="video-card-title">{video.title}</h3>
                        </div>
                      </a>
                    ))}
                  </div>
                  
                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="video-pagination">
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

            {/* 쇼츠 섹션 */}
            <div className="video-page-shorts-section">
              <h2 className="section-subtitle">쇼츠</h2>
              {loading ? (
                <div className="video-loading">쇼츠를 불러오는 중...</div>
              ) : shorts.length === 0 ? (
                <div className="video-empty">등록된 쇼츠가 없습니다.</div>
              ) : (
                <div className="shorts-scroll-container">
                  <div className="shorts-grid">
                    {shorts.map((short) => (
                      <a 
                        key={short._id}
                        href={short.youtubeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="short-card-link"
                      >
                        <div className="short-card">
                          <div className="short-thumbnail">
                            <img 
                              src={short.thumbnailUrl} 
                              alt={short.title}
                              className="short-thumbnail-image"
                              onError={(e) => {
                                const videoId = short.youtubeUrl.match(/[?&]v=([^&]+)/)?.[1] || 
                                              short.youtubeUrl.match(/youtu\.be\/([^?]+)/)?.[1];
                                if (videoId) {
                                  e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                }
                              }}
                            />
                            <div className="short-play-overlay">
                              <svg className="short-play-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"></path>
                              </svg>
                            </div>
                          </div>
                          <h3 className="short-card-title">{short.title}</h3>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VideoPage;

