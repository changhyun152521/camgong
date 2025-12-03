import { useEffect, useRef, useState } from 'react';
import '../App.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VideoPlayer from '../components/VideoPlayer';
import MobileConsultButton from '../components/MobileConsultButton';
import api from '../utils/api';

function Home() {
  const profileLeftRef = useRef(null);
  const profileRightRef = useRef(null);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const adjustImageHeights = () => {
      if (profileRightRef.current && profileLeftRef.current) {
        const rightImg = profileRightRef.current;
        const leftImg = profileLeftRef.current;
        
        // 오른쪽 이미지가 완전히 로드되었는지 확인
        if (rightImg.complete && rightImg.naturalHeight > 0) {
          // requestAnimationFrame을 사용하여 레이아웃이 완전히 업데이트된 후 조정
          requestAnimationFrame(() => {
            // 오른쪽 이미지의 실제 렌더링된 높이 가져오기
            const rightHeight = rightImg.offsetHeight || rightImg.clientHeight || rightImg.getBoundingClientRect().height;
            
            if (rightHeight > 0) {
              // 왼쪽 이미지의 자연스러운 aspect ratio 계산
              if (leftImg.complete && leftImg.naturalWidth > 0 && leftImg.naturalHeight > 0) {
                const leftAspectRatio = leftImg.naturalWidth / leftImg.naturalHeight;
                
                // 왼쪽 이미지를 오른쪽보다 높이 기준 5% 작게 설정
                const leftHeight = rightHeight * 0.95;
                
                // 높이를 설정하고, aspect ratio를 유지하면서 너비 계산
                leftImg.style.height = `${leftHeight}px`;
                leftImg.style.width = `${leftHeight * leftAspectRatio}px`;
              } else {
                // 이미지가 아직 로드되지 않았으면 높이만 설정하고 너비는 auto
                const leftHeight = rightHeight * 0.95;
                leftImg.style.height = `${leftHeight}px`;
                leftImg.style.width = 'auto';
              }
            }
          });
        }
      }
    };

    const handleImageLoad = () => {
      // 이미지 로드 후 약간의 지연을 두어 레이아웃이 완전히 렌더링된 후 조정
      requestAnimationFrame(() => {
        setTimeout(adjustImageHeights, 50);
      });
    };

    const rightImg = profileRightRef.current;
    const leftImg = profileLeftRef.current;

    if (rightImg && leftImg) {
      // 이미지가 이미 로드되어 있는지 확인
      if (rightImg.complete && leftImg.complete) {
        handleImageLoad();
      } else {
        // 이미지 로드 이벤트 리스너 추가
        rightImg.addEventListener('load', handleImageLoad);
        leftImg.addEventListener('load', handleImageLoad);
      }
    }

    // ResizeObserver를 사용하여 오른쪽 이미지의 크기 변화를 직접 감지
    let resizeObserver;
    if (rightImg && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        // 디바운싱
        requestAnimationFrame(() => {
          setTimeout(adjustImageHeights, 50);
        });
      });
      resizeObserver.observe(rightImg);
    }

    // 윈도우 리사이즈 시에도 조정 (디바운싱) - ResizeObserver가 없을 때를 대비
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        requestAnimationFrame(adjustImageHeights);
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    // 초기 실행 (이미지 로드 대기)
    const initialTimeout = setTimeout(() => {
      requestAnimationFrame(adjustImageHeights);
    }, 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      clearTimeout(initialTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (rightImg) rightImg.removeEventListener('load', handleImageLoad);
      if (leftImg) leftImg.removeEventListener('load', handleImageLoad);
    };
  }, []);

  // 영상 목록 로드
  useEffect(() => {
    const loadVideos = async () => {
      try {
        // 페이지네이션 없이 모든 영상 가져오기 (메인 페이지용)
        const response = await api.get('/videos?limit=1000');
        if (response.data.success) {
          // 동영상만 필터링 (쇼츠는 제외)하고 최신순 정렬 후 최대 4개까지만 표시
          const filteredVideos = response.data.data
            .filter(video => video.videoFormat === '동영상')
            .sort((a, b) => {
              const dateA = new Date(a.publishedAt || a.createdAt);
              const dateB = new Date(b.publishedAt || b.createdAt);
              return dateB - dateA; // 최신순 (내림차순)
            })
            .slice(0, 4);
          setVideos(filteredVideos);
        }
      } catch (error) {
        console.error('영상 목록 로드 오류:', error);
        // 오류 발생 시 빈 배열로 설정하여 앱이 계속 작동하도록 함
        setVideos([]);
      } finally {
        setVideosLoading(false);
      }
    };

    loadVideos();
  }, []);

  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <img 
                src="/배너로고 수정수정.png" 
                alt="캠핑공작소 배너 제목" 
                className="hero-title-image"
              />
            </div>
            <div className="banner-buttons-overlay">
            <div className="banner-buttons-container">
              <div className="banner-buttons-row">
                <img 
                  src="/배터버튼1.png" 
                  alt="배너 버튼 1" 
                  className="banner-button-image"
                />
                <img 
                  src="/배터버튼2.png" 
                  alt="배너 버튼 2" 
                  className="banner-button-image"
                />
                <img 
                  src="/배터버튼3.png" 
                  alt="배너 버튼 3" 
                  className="banner-button-image"
                />
              </div>
              <div className="banner-buttons-row">
                <img 
                  src="/배터버튼4.png" 
                  alt="배너 버튼 4" 
                  className="banner-button-image"
                />
                <img 
                  src="/배터버튼5.png" 
                  alt="배너 버튼 5" 
                  className="banner-button-image"
                />
                <img 
                  src="/배터버튼6.png" 
                  alt="배너 버튼 6" 
                  className="banner-button-image"
                />
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* About Section - 회사소개 */}
        <section className="about-section" id="about">
          <div className="about-container">
            <div className="about-header">
              <img 
                src="/제목을 입력해주세요_-003.png" 
                alt="회사소개" 
                className="about-title-image"
              />
            </div>
            
            <div className="about-content">
              <div className="about-main-text">
                <p className="about-description">
                  캠핑공작소는 DIY공방을 운영하며 자작회원들과<br />
                  함께하는 전문 캠핑카 커스터마이징 공간입니다.
                </p>
                <p className="about-description">
                  전문 장비와 도구를 갖춘 공방에서 나만의 캠핑카를<br />
                  직접 만들고 개조할 수 있는 환경을 제공합니다.
                </p>
              </div>
            </div>
          </div>
          
          {/* 프로필 이미지 */}
          <div className="about-profiles-container">
            <img 
              ref={profileLeftRef}
              src="/야인형 프로.png" 
              alt="프로필" 
              className="about-profile-left"
            />
            <img 
              ref={profileRightRef}
              src="/Gemini_Generated_Image_4y4r44y4r44y4r44_-_복사본-removebg-preview.png" 
              alt="프로필" 
              className="about-profile-right"
            />
          </div>
        </section>

        {/* Services Section */}
        <section className="services-section">
          <div className="services-container">
            <div className="services-title-wrapper">
              <svg className="services-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              <h2 className="section-title">주요 서비스</h2>
            </div>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon-wrapper">
                  <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"></path>
                    <polygon points="12 15 17 21 7 21 12 15"></polygon>
                  </svg>
                </div>
                <h3 className="service-card-title">캠핑카 커스터마이징</h3>
                <p className="service-card-description">나만의 스타일로 캠핑카를 개조하세요</p>
              </div>
              <div className="service-card">
                <div className="service-icon-wrapper">
                  <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                </div>
                <h3 className="service-card-title">자작 DIY 공방</h3>
                <p className="service-card-description">직접 만드는 특별한 캠핑용품</p>
              </div>
              <div className="service-card">
                <div className="service-icon-wrapper">
                  <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                  </svg>
                </div>
                <h3 className="service-card-title">캠핑카 부품 판매</h3>
                <p className="service-card-description">다양한 고품질 부품을 제공합니다</p>
              </div>
              <div className="service-card">
                <div className="service-icon-wrapper">
                  <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                </div>
                <h3 className="service-card-title">캠핑카 구조변경</h3>
                <p className="service-card-description">구조변경 승인작업을 도와드려요</p>
              </div>
              <div className="service-card">
                <div className="service-icon-wrapper">
                  <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h3 className="service-card-title">컨설팅 서비스</h3>
                <p className="service-card-description">전문가의 맞춤형 상담을 받아보세요</p>
              </div>
              <div className="service-card">
                <div className="service-icon-wrapper">
                  <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <h3 className="service-card-title">수리 및 장비</h3>
                <p className="service-card-description">안전하고 신속한 수리 서비스</p>
              </div>
            </div>
          </div>
        </section>

        {/* Video Section - 영상 보기 */}
        <section className="video-section">
          <div className="video-container">
            <div className="video-title-wrapper">
              <img 
                src="/제목을-입력해주세요_-001 (5).png" 
                alt="영상 보기" 
                className="video-title-image"
              />
            </div>
            <div className="video-grid">
              {videosLoading ? (
                <div className="video-loading">영상을 불러오는 중...</div>
              ) : videos.length === 0 ? (
                <div className="video-empty">등록된 영상이 없습니다.</div>
              ) : (
                videos.map((video) => {
                  const getVideoId = (youtubeUrl) => {
                    return youtubeUrl.match(/[?&]v=([^&]+)/)?.[1] || 
                           youtubeUrl.match(/youtu\.be\/([^?]+)/)?.[1];
                  };
                  
                  const videoId = getVideoId(video.youtubeUrl);
                  
                  return (
                    <div 
                      key={video._id}
                      className="video-card-link"
                      onClick={() => {
                        if (videoId) {
                          setSelectedVideo({ videoId, title: video.title });
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="video-card">
                        <div className="video-thumbnail">
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title}
                            className="video-thumbnail-image"
                            onError={(e) => {
                              // 썸네일 로드 실패 시 대체 썸네일 사용
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
                    </div>
                  );
                })
              )}
            </div>
            {!videosLoading && videos.length > 0 && (
              <p className="video-more-message">더 많은 영상은 메뉴에서 시청하세요</p>
            )}
          </div>
        </section>
      </main>

      <Footer />
      
      <MobileConsultButton />
      
      {selectedVideo && (
        <VideoPlayer
          videoId={selectedVideo.videoId}
          title={selectedVideo.title}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}

export default Home;
