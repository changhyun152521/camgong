import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './VideoManagement.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../utils/api';

const VideoManagement = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndLoadVideos();
  }, []);

  useEffect(() => {
    loadVideos();
  }, [currentPage]);

  const checkAdminAndLoadVideos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      // 관리자 확인
      const userResponse = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (userResponse.data.success && userResponse.data.data.userType !== 'admin') {
        alert('관리자만 접근할 수 있습니다.');
        navigate('/');
        return;
      }

      // 영상 목록 로드
      await loadVideos();
    } catch (error) {
      console.error('오류:', error);
      alert('데이터를 불러오는데 실패했습니다.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      const response = await api.get(`/videos?page=${currentPage}&limit=10`);
      if (response.data.success) {
        setVideos(response.data.data);
        setTotalPages(response.data.totalPages || 1);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('영상 목록 로드 오류:', error);
      alert('영상 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleSyncChannel = async () => {
    if (!window.confirm('유튜브 채널의 모든 영상을 동기화하시겠습니까?')) {
      return;
    }

    // 비동기 작업을 즉시 시작하여 클릭 핸들러가 빠르게 반환되도록 함
    setSyncing(true);
    
    // 다음 이벤트 루프에서 실행하여 클릭 핸들러가 먼저 완료되도록 함
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.post('/videos/admin/sync', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          alert(response.data.message);
          setCurrentPage(1); // 첫 페이지로 이동
          await loadVideos();
        }
      } catch (error) {
        console.error('채널 동기화 오류:', error);
        alert(error.response?.data?.message || '채널 동기화에 실패했습니다.');
      } finally {
        setSyncing(false);
      }
    }, 0);
  };

  const handleVideoTypeChange = async (videoId, newVideoType) => {
    // 즉시 로컬 상태 업데이트 (낙관적 업데이트)
    setVideos(prevVideos =>
      prevVideos.map(video =>
        video._id === videoId
          ? { ...video, videoType: newVideoType }
          : video
      )
    );

    // 비동기 작업은 다음 이벤트 루프에서 실행
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.patch(`/videos/admin/${videoId}/type`, 
          { videoType: newVideoType },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.data.success) {
          // 실패 시 영상 목록 다시 로드하여 원래 상태로 복구
          await loadVideos();
          alert('영상 타입 변경에 실패했습니다.');
        }
      } catch (error) {
        console.error('영상 타입 변경 오류:', error);
        // 실패 시 영상 목록 다시 로드하여 원래 상태로 복구
        await loadVideos();
        alert(error.response?.data?.message || '영상 타입 변경에 실패했습니다.');
      }
    }, 0);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="App">
        <Header />
        <div className="video-management-loading">로딩 중...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <div className="video-management">
      <div className="video-management-container">
        <div className="video-management-header">
          <h1 className="video-management-title">영상 관리</h1>
          <button 
            className="sync-channel-button"
            onClick={handleSyncChannel}
            disabled={syncing}
          >
            {syncing ? '동기화 중...' : '채널 동기화'}
          </button>
        </div>

        <div className="video-stats">
          <p>총 {total}개의 영상</p>
        </div>

        <div className="video-table-wrapper">
          <table className="video-table">
            <thead>
              <tr>
                <th>썸네일</th>
                <th>제목</th>
                <th>영상 타입</th>
                <th>영상 형식</th>
                <th>유튜브 링크</th>
                <th>생성일</th>
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-videos">등록된 영상이 없습니다. 채널 동기화를 실행해주세요.</td>
                </tr>
              ) : (
                videos.map(video => (
                  <tr key={video._id}>
                    <td>
                      <img 
                        src={video.thumbnailUrl} 
                        alt={video.title}
                        className="video-thumbnail-preview"
                        onError={(e) => {
                          // 썸네일 로드 실패 시 대체 썸네일 사용
                          const videoId = video.youtubeUrl.match(/[?&]v=([^&]+)/)?.[1] || 
                                        video.youtubeUrl.match(/youtu\.be\/([^?]+)/)?.[1];
                          if (videoId) {
                            e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                          }
                        }}
                      />
                    </td>
                    <td>{video.title}</td>
                    <td>
                      <select
                        value={video.videoType || '기타'}
                        onChange={(e) => handleVideoTypeChange(video._id, e.target.value)}
                        className="video-type-select"
                      >
                        <option value="자작솜씨">자작솜씨</option>
                        <option value="자작강의">자작강의</option>
                        <option value="기타">기타</option>
                      </select>
                    </td>
                    <td>{video.videoFormat || '동영상'}</td>
                    <td>
                      <a 
                        href={video.youtubeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="youtube-link"
                      >
                        링크 보기
                      </a>
                    </td>
                    <td>{new Date(video.publishedAt || video.createdAt).toLocaleDateString('ko-KR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              이전
            </button>
            <div className="pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // 현재 페이지 주변 5페이지만 표시
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={page}
                      className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 3 ||
                  page === currentPage + 3
                ) {
                  return <span key={page} className="pagination-ellipsis">...</span>;
                }
                return null;
              })}
            </div>
            <button
              className="pagination-button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              다음
            </button>
          </div>
        )}

        <button 
          className="back-button"
          onClick={() => navigate('/admin')}
        >
          관리자 페이지로 돌아가기
        </button>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default VideoManagement;
