import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import '../App.css';
import './ShortsPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../utils/api';

const ShortsPage = () => {
  const { type } = useParams(); // '자작솜씨' 또는 '자작강의'
  const [shorts, setShorts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [slideDirection, setSlideDirection] = useState('right');
  const containerRef = useRef(null);
  const touchStartYRef = useRef(null);
  const touchEndYRef = useRef(null);

  // URL 디코딩
  const decodedType = type ? decodeURIComponent(type) : '';

  const loadShorts = useCallback(async () => {
    try {
      setLoading(true);
      // 모든 영상 가져오기
      const response = await api.get('/videos?limit=1000');
      if (response.data.success) {
        const allVideos = response.data.data;
        
        // 타입에 맞는 쇼츠만 필터링 (videoFormat === '쇼츠')
        const filteredShorts = allVideos.filter(video => 
          video.videoType === decodedType && video.videoFormat === '쇼츠'
        );
        
        setShorts(filteredShorts);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('쇼츠 목록 로드 오류:', error);
      setShorts([]);
    } finally {
      setLoading(false);
    }
  }, [decodedType]);

  useEffect(() => {
    loadShorts();
  }, [loadShorts]);


  const handleNext = useCallback(() => {
    setSlideDirection('right');
    setCurrentIndex(prev => {
      if (prev < shorts.length - 1) {
        return prev + 1;
      } else {
        // 마지막 쇼츠에서 다음으로 가면 첫 번째로 (반복)
        return 0;
      }
    });
    // 재생 중에도 넘어갈 수 있도록 재생 상태 유지
    // 새로운 쇼츠의 videoId로 업데이트
    const nextIndex = currentIndex < shorts.length - 1 ? currentIndex + 1 : 0;
    const nextShort = shorts[nextIndex];
    if (nextShort && nextShort.youtubeUrl) {
      const nextVideoId = getVideoId(nextShort.youtubeUrl);
      if (nextVideoId) {
        setPlayingVideoId(nextVideoId);
      }
    }
  }, [shorts, currentIndex]);

  const handlePrevious = useCallback(() => {
    setSlideDirection('left');
    setCurrentIndex(prev => {
      if (prev > 0) {
        return prev - 1;
      } else {
        // 첫 번째 쇼츠에서 이전으로 가면 마지막으로 (반복)
        return shorts.length - 1;
      }
    });
    // 재생 중에도 넘어갈 수 있도록 재생 상태 유지
    // 새로운 쇼츠의 videoId로 업데이트
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : shorts.length - 1;
    const prevShort = shorts[prevIndex];
    if (prevShort && prevShort.youtubeUrl) {
      const prevVideoId = getVideoId(prevShort.youtubeUrl);
      if (prevVideoId) {
        setPlayingVideoId(prevVideoId);
      }
    }
  }, [shorts, currentIndex]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious]);

  // 마우스 드래그 이벤트 처리
  const onMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const onMouseMove = (e) => {
    if (!isDragging || dragStart === null) return;
    // 드래그 중일 때는 커서만 변경 (onMouseUp에서 처리)
    e.preventDefault();
  };

  const onMouseUp = (e) => {
    if (!isDragging || dragStart === null) {
      setIsDragging(false);
      setDragStart(null);
      return;
    }

    const dragEnd = e.clientX;
    const distance = dragStart - dragEnd;
    const minDragDistance = 50;

    // 재생 중에도 드래그로 넘어갈 수 있음
    if (distance > minDragDistance) {
      // 왼쪽으로 드래그 (다음)
      handleNext();
    } else if (distance < -minDragDistance) {
      // 오른쪽으로 드래그 (이전)
      handlePrevious();
    }

    setIsDragging(false);
    setDragStart(null);
  };


  // currentIndex 변경 시 새로운 쇼츠 자동 재생
  useEffect(() => {
    const currentShort = shorts.length > 0 && currentIndex < shorts.length ? shorts[currentIndex] : null;
    if (currentShort && currentShort.youtubeUrl) {
      const newVideoId = getVideoId(currentShort.youtubeUrl);
      if (newVideoId) {
        setPlayingVideoId(newVideoId);
        setIsMuted(true);
      }
    }
  }, [currentIndex, shorts]);


  // 터치 이벤트 처리 (좌우 스와이프)
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    // 버튼 클릭은 스와이프로 처리하지 않음
    const target = e.target;
    if (target.closest('.shorts-nav-button') || target.closest('.shorts-mute-toggle-button')) {
      return;
    }
    
    // 쇼츠 컨테이너 내부에서만 터치 시작 위치 저장
    const container = containerRef.current;
    if (container && container.contains(e.target)) {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
      touchStartYRef.current = e.targetTouches[0].clientY;
    }
  };

  const onTouchMove = (e) => {
    // 버튼 클릭은 스와이프로 처리하지 않음
    const target = e.target;
    if (target.closest('.shorts-nav-button') || target.closest('.shorts-mute-toggle-button')) {
      return;
    }
    
    // 쇼츠 컨테이너 내부에서만 터치 이동 추적
    const container = containerRef.current;
    if (container && container.contains(e.target) && touchStart !== null) {
      setTouchEnd(e.targetTouches[0].clientX);
      touchEndYRef.current = e.targetTouches[0].clientY;
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !touchStartYRef.current || !touchEndYRef.current) {
      setTouchStart(null);
      setTouchEnd(null);
      touchStartYRef.current = null;
      touchEndYRef.current = null;
      return;
    }
    
    const distanceX = touchStart - touchEnd;
    const distanceY = Math.abs(touchStartYRef.current - touchEndYRef.current);
    
    // 좌우 스와이프가 위아래 스크롤보다 크고 최소 거리 이상이면 쇼츠 네비게이션 처리
    if (Math.abs(distanceX) > distanceY && Math.abs(distanceX) > minSwipeDistance) {
      const isLeftSwipe = distanceX > minSwipeDistance; // 왼쪽으로 스와이프 (다음)
      const isRightSwipe = distanceX < -minSwipeDistance; // 오른쪽으로 스와이프 (이전)

      if (isLeftSwipe) {
        handleNext();
      } else if (isRightSwipe) {
        handlePrevious();
      }
    }
    
    // 터치 상태 초기화
    setTouchStart(null);
    setTouchEnd(null);
    touchStartYRef.current = null;
    touchEndYRef.current = null;
  };

  const getVideoId = (youtubeUrl) => {
    if (!youtubeUrl) return null;
    
    // YouTube Shorts URL 형식: https://www.youtube.com/shorts/VIDEO_ID
    const shortsMatch = youtubeUrl.match(/youtube\.com\/shorts\/([^/?&]+)/);
    if (shortsMatch) {
      return shortsMatch[1];
    }
    
    // 일반 YouTube URL 형식: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = youtubeUrl.match(/[?&]v=([^&]+)/);
    if (watchMatch) {
      return watchMatch[1];
    }
    
    // 짧은 URL 형식: https://youtu.be/VIDEO_ID
    const shortUrlMatch = youtubeUrl.match(/youtu\.be\/([^?]+)/);
    if (shortUrlMatch) {
      return shortUrlMatch[1];
    }
    
    return null;
  };

  // YouTube Shorts 썸네일 URL 생성 (9:16 비율)
  const getShortsThumbnailUrl = (videoId, thumbnailUrl) => {
    if (videoId) {
      // YouTube Shorts 썸네일 (9:16 비율)
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return thumbnailUrl || '';
  };

  const currentShort = shorts.length > 0 && currentIndex < shorts.length ? shorts[currentIndex] : null;
  const pageTitle = decodedType === '자작솜씨' ? '솜씨쇼츠' : '강의쇼츠';

  if (loading) {
    return (
      <div className="App">
        <Header />
        <div className="shorts-loading">쇼츠를 불러오는 중...</div>
        <Footer />
      </div>
    );
  }

  if (shorts.length === 0 || !currentShort) {
    return (
      <div className="App">
        <Header />
        <div className="shorts-empty">등록된 쇼츠가 없습니다.</div>
        <Footer />
      </div>
    );
  }

  const videoId = currentShort?.youtubeUrl ? getVideoId(currentShort.youtubeUrl) : null;
  const isPlaying = playingVideoId === videoId && videoId !== null;
  
  // YouTube 자동 재생을 위해 초기에는 mute=1이 필수 (브라우저 정책)
  // loop=1로 설정하여 반복 재생
  // mute 상태에 따라 동적으로 변경
  // rel=0: 관련 동영상 숨기기
  // modestbranding=1: YouTube 로고 최소화
  // fs=0: 전체화면 버튼 숨기기
  // iv_load_policy=3: 주석 숨기기
  // cc_load_policy=0: 자막 자동 로드 안 함
  const embedUrl = isPlaying && videoId 
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1&controls=1&enablejsapi=1&loop=1&playlist=${videoId}&fs=0&iv_load_policy=3&cc_load_policy=0&origin=${encodeURIComponent(window.location.origin)}` 
    : null;

  const handlePlay = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    // currentShort에서 직접 videoId 추출
    const currentShort = shorts.length > 0 && currentIndex < shorts.length ? shorts[currentIndex] : null;
    if (!currentShort || !currentShort.youtubeUrl) {
      console.log('No videoId found - currentShort or youtubeUrl is missing');
      return;
    }
    
    const extractedVideoId = getVideoId(currentShort.youtubeUrl);
    if (extractedVideoId) {
      console.log('Playing video:', extractedVideoId);
      setPlayingVideoId(extractedVideoId);
      setIsMuted(true);
    } else {
      console.log('No videoId found - failed to extract from URL:', currentShort.youtubeUrl);
    }
  };

  // iframe이 로드된 후 재생 강제 (사용자 상호작용 후이므로 autoplay 작동)
  const handleIframeLoad = (loadedVideoId) => {
    console.log('YouTube iframe loaded for video:', loadedVideoId);
    // iframe이 로드되면 자동 재생되도록 postMessage 전송
    setTimeout(() => {
      const iframe = document.getElementById(`youtube-iframe-${loadedVideoId}`);
      if (iframe && iframe.contentWindow) {
        try {
          // YouTube iframe API를 통해 재생 명령 전송
          iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } catch (err) {
          console.error('Failed to send play command:', err);
        }
      }
    }, 500);
  };


  // 음소거/해제 토글
  const handleToggleMute = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    if (!isPlaying || !videoId) return;
    
    const iframe = document.getElementById(`youtube-iframe-${videoId}`);
    if (!iframe) return;
    
    try {
      // postMessage로 mute/unmute 명령 전송
      if (iframe.contentWindow) {
        if (isMuted) {
          // 음소거 해제
          iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
          console.log('Unmute command sent');
        } else {
          // 음소거
          iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
          console.log('Mute command sent');
        }
        setIsMuted(!isMuted);
      }
    } catch (err) {
      console.error('Toggle mute failed:', err);
      // fallback: 상태만 변경 (embedUrl이 자동으로 업데이트됨)
      setIsMuted(!isMuted);
    }
  };

  // 재생/일시정지 토글
  const handleTogglePlayPause = (e) => {
    e?.stopPropagation();
    if (!isPlaying || !videoId) return;
    
    const iframe = document.getElementById(`youtube-iframe-${videoId}`);
    if (iframe && iframe.contentWindow) {
      try {
        if (isPaused) {
          // 재생
          iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          setIsPaused(false);
        } else {
          // 일시정지
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          setIsPaused(true);
        }
      } catch (err) {
        console.error('Toggle play/pause failed:', err);
      }
    }
  };

  return (
    <div className="App">
      <Header />
      
      <main className="shorts-main">
        <div className="shorts-header">
          <h1 className="shorts-page-title">{pageTitle}</h1>
          <div className="shorts-counter">
            {currentIndex + 1} / {shorts.length}
          </div>
        </div>

        <div 
          className="shorts-container"
          ref={containerRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <div 
            className={`shorts-player-wrapper ${isPlaying ? 'playing' : ''} slide-${slideDirection}`} 
            key={`wrapper-${currentIndex}`}
            style={{ cursor: isPlaying ? 'pointer' : 'default' }}
          >
            {isPlaying && videoId && embedUrl ? (
              <div className="shorts-iframe-container">
                <iframe
                  id={`youtube-iframe-${videoId}`}
                  key={`${videoId}-${currentIndex}-${playingVideoId}-${isMuted ? 'muted' : 'unmuted'}`}
                  src={embedUrl}
                  title={currentShort?.title || ''}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="shorts-iframe"
                  onLoad={() => {
                    handleIframeLoad(videoId);
                    setIsPaused(false);
                  }}
                ></iframe>
                {/* 터치/클릭 오버레이 - iframe 위에 투명한 레이어 추가 */}
                <div 
                  className="shorts-touch-overlay"
                  onClick={(e) => {
                    const target = e.target;
                    const isNavButton = target.closest('.shorts-nav-button') || 
                                        target.closest('.shorts-mute-toggle-button') ||
                                        target.closest('.shorts-pause-overlay');
                    if (!isNavButton && isPlaying) {
                      handleTogglePlayPause(e);
                    }
                  }}
                  onTouchStart={(e) => {
                    const target = e.target;
                    const isNavButton = target.closest('.shorts-nav-button') || 
                                        target.closest('.shorts-mute-toggle-button') ||
                                        target.closest('.shorts-pause-overlay');
                    if (!isNavButton && isPlaying) {
                      e.stopPropagation();
                    }
                  }}
                  onTouchEnd={(e) => {
                    const target = e.target;
                    const isNavButton = target.closest('.shorts-nav-button') || 
                                        target.closest('.shorts-mute-toggle-button') ||
                                        target.closest('.shorts-pause-overlay');
                    if (!isNavButton && isPlaying) {
                      e.stopPropagation();
                      e.preventDefault();
                      handleTogglePlayPause(e);
                    }
                  }}
                ></div>
                {isPaused && (
                  <div className="shorts-pause-overlay">
                    <div className="shorts-pause-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"></path>
                      </svg>
                    </div>
                  </div>
                )}
                <button
                  className="shorts-mute-toggle-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleToggleMute(e);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onTouchMove={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleToggleMute(e);
                  }}
                  aria-label={isMuted ? "음소거 해제" : "음소거"}
                  type="button"
                  style={{ touchAction: 'manipulation', zIndex: 30 }}
                >
                  {isMuted ? (
                    // 음소거 상태 (소리 안 나옴) - 음소거 아이콘
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    // 소리 나오는 상태 - 스피커 아이콘
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <div 
                className="shorts-thumbnail-container"
                onClick={handlePlay}
              >
                <img 
                  src={getShortsThumbnailUrl(videoId, currentShort?.thumbnailUrl)} 
                  alt={currentShort?.title || ''}
                  className="shorts-thumbnail-image"
                  onError={(e) => {
                    if (videoId) {
                      // fallback: 일반 썸네일 사용
                      e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    }
                  }}
                />
                <div 
                  className="shorts-play-button-wrapper"
                  onClick={handlePlay}
                >
                  <div className="shorts-play-button">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            <div className="shorts-info">
              <h2 className="shorts-title">{currentShort?.title || ''}</h2>
            </div>
          </div>

          {/* 네비게이션 버튼 - 왼쪽/오른쪽 (재생 중에도 작동) */}
          <button
            className="shorts-nav-button shorts-nav-left"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handlePrevious();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handlePrevious();
            }}
            aria-label="이전 쇼츠"
            style={{ pointerEvents: 'auto', touchAction: 'manipulation', zIndex: 30 }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
            </svg>
          </button>

          <button
            className="shorts-nav-button shorts-nav-right"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleNext();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleNext();
            }}
            aria-label="다음 쇼츠"
            style={{ pointerEvents: 'auto', touchAction: 'manipulation', zIndex: 30 }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
            </svg>
          </button>
        </div>

        {/* 인디케이터 */}
        <div className="shorts-indicators">
          {shorts.map((_, index) => (
            <button
              key={index}
              className={`shorts-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`쇼츠 ${index + 1}`}
            />
          ))}
        </div>

        {/* 안내 메시지 */}
        <div className="shorts-hint">
          <p>좌, 우의 버튼을 누르면, 이전, 다음 쇼츠영상으로 넘어가실 수 있습니다.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShortsPage;

