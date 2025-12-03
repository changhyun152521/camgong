import { useState, useEffect } from 'react';
import '../App.css';
import './ContactPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../utils/api';

const ContactPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [user, setUser] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const inquiriesPerPage = 8;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    phone: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData(prev => ({
          ...prev,
          author: parsedUser.name || parsedUser.userId || '',
          phone: parsedUser.phoneNumber || ''
        }));
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
      }
    }
    loadInquiries();
  }, [currentPage]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/inquiries?page=${currentPage}&limit=${inquiriesPerPage}`);
      if (response.data.success) {
        setInquiries(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('문의사항 목록 로드 오류:', error);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWriteClick = () => {
    if (!user) {
      alert('문의사항을 작성하려면 로그인이 필요합니다.\n\n상단의 "로그인" 버튼을 클릭하여 로그인해주세요.');
      return;
    }
    setShowWriteForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = '제목을 입력해주세요.';
    }
    if (!formData.content.trim()) {
      errors.content = '내용을 입력해주세요.';
    }
    if (!formData.author.trim()) {
      errors.author = '작성자를 입력해주세요.';
    }
    if (!formData.phone.trim()) {
      errors.phone = '전화번호를 입력해주세요.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await api.post('/inquiries', formData);
      if (response.data.success) {
        alert('문의사항이 등록되었습니다.');
        setShowWriteForm(false);
        setFormData({
          title: '',
          content: '',
          author: user?.name || user?.userId || '',
          phone: user?.phoneNumber || ''
        });
        // 첫 페이지로 이동하여 최신글 확인
        setCurrentPage(1);
        await loadInquiries();
      }
    } catch (error) {
      console.error('문의사항 등록 오류:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || '문의사항 등록 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  const handleInquiryClick = async (inquiry) => {
    try {
      // 상세 정보를 다시 가져와서 조회수 업데이트
      const response = await api.get(`/inquiries/${inquiry._id}`);
      if (response.data.success) {
        setSelectedInquiry(response.data.data);
      } else {
        setSelectedInquiry(inquiry);
      }
    } catch (error) {
      console.error('문의사항 상세 조회 오류:', error);
      // 오류가 발생해도 기본 정보로 표시
      setSelectedInquiry(inquiry);
    }
  };

  const handleCloseDetail = () => {
    setSelectedInquiry(null);
  };

  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm('정말로 이 문의사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await api.delete(`/inquiries/${inquiryId}`);
      if (response.data.success) {
        alert('문의사항이 삭제되었습니다.');
        setSelectedInquiry(null);
        loadInquiries();
      }
    } catch (error) {
      console.error('문의사항 삭제 오류:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || '문의사항 삭제 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  // 작성자 본인인지 확인하는 함수
  const isAuthor = (inquiry) => {
    if (!user || !inquiry) return false;
    
    // 관리자는 항상 true
    if (user.userType === 'admin') return true;
    
    // 작성자 ID 비교
    const userId = user._id || user.id;
    const authorId = inquiry.author?._id || inquiry.author?.id || inquiry.author;
    
    if (userId && authorId) {
      const userIdStr = userId.toString ? userId.toString() : String(userId);
      const authorIdStr = authorId.toString ? authorId.toString() : String(authorId);
      if (userIdStr === authorIdStr) return true;
    }
    
    // 작성자명 비교 (fallback)
    const authorName = inquiry.authorName || inquiry.author?.name || inquiry.author?.userId;
    const userName = user.name || user.userId;
    if (authorName && userName && authorName === userName) return true;
    
    return false;
  };

  // 작성자 표시 함수 (관리자는 "관리자", 일반 사용자는 userId 표시)
  const getAuthorDisplay = (inquiry) => {
    if (!inquiry) return '알 수 없음';
    
    // 관리자가 작성한 글인지 확인
    const authorUserType = inquiry.author?.userType;
    if (authorUserType === 'admin') {
      return '관리자';
    }
    
    // 일반 사용자는 userId 표시
    const userId = inquiry.author?.userId || inquiry.authorName || '알 수 없음';
    return userId;
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    return date.toLocaleDateString('ko-KR');
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

  const getStatusBadge = (status) => {
    const statusClass = {
      '답변완료': 'status-completed',
      '답변대기': 'status-waiting'
    };
    return statusClass[status] || 'status-waiting';
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    if (!selectedInquiry) return;

    setIsSubmittingAnswer(true);
    try {
      const response = await api.put(`/inquiries/${selectedInquiry._id}/answer`, {
        answer: answerText
      });
      
      if (response.data.success) {
        alert(isEditingAnswer ? '답변이 수정되었습니다.' : '답변이 등록되었습니다.');
        setAnswerText('');
        setIsEditingAnswer(false);
        // 상세 정보 다시 불러오기
        const detailResponse = await api.get(`/inquiries/${selectedInquiry._id}`);
        if (detailResponse.data.success) {
          setSelectedInquiry(detailResponse.data.data);
        }
        // 목록도 새로고침
        loadInquiries();
      }
    } catch (error) {
      console.error('답변 등록 오류:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || '답변 등록 중 오류가 발생했습니다.';
      alert(errorMessage);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleEditAnswer = () => {
    if (selectedInquiry?.answer) {
      setAnswerText(selectedInquiry.answer);
      setIsEditingAnswer(true);
    }
  };

  const handleCancelEdit = () => {
    setAnswerText('');
    setIsEditingAnswer(false);
  };

  const handleDeleteAnswer = async () => {
    if (!selectedInquiry) return;
    
    if (!window.confirm('정말로 이 답변을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await api.delete(`/inquiries/${selectedInquiry._id}/answer`);
      if (response.data.success) {
        alert('답변이 삭제되었습니다.');
        setAnswerText('');
        setIsEditingAnswer(false);
        // 상세 정보 다시 불러오기
        const detailResponse = await api.get(`/inquiries/${selectedInquiry._id}`);
        if (detailResponse.data.success) {
          setSelectedInquiry(detailResponse.data.data);
        }
        // 목록도 새로고침
        loadInquiries();
      }
    } catch (error) {
      console.error('답변 삭제 오류:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || '답변 삭제 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        <section className="contact-section">
          <div className="contact-container">
            <div className="contact-header">
              <div className="contact-title-icon-wrapper">
                <svg className="contact-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h1 className="contact-title">문의사항</h1>
              <p className="contact-subtitle">궁금한 사항을 남겨주시면 빠르게 답변드리겠습니다.</p>
            </div>

            <div className="contact-actions">
              <button 
                className="contact-write-btn"
                onClick={handleWriteClick}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                문의하기
              </button>
            </div>

            {showWriteForm && (
              <div className="contact-form-modal">
                <div className="contact-form-overlay" onClick={() => setShowWriteForm(false)}></div>
                <div className="contact-form-content">
                  <div className="contact-form-header">
                    <h2>문의사항 작성</h2>
                    <button 
                      className="contact-form-close"
                      onClick={() => setShowWriteForm(false)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <form onSubmit={handleFormSubmit} className="contact-form">
                    <div className="form-group">
                      <label htmlFor="title">제목 *</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleFormChange}
                        placeholder="문의사항 제목을 입력해주세요"
                      />
                      {formErrors.title && <span className="form-error">{formErrors.title}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="author">작성자 *</label>
                      <input
                        type="text"
                        id="author"
                        name="author"
                        value={formData.author}
                        onChange={handleFormChange}
                        placeholder="작성자 이름"
                        readOnly={!!user}
                        style={user ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                      />
                      {user && (
                        <span style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>
                          회원 정보에서 자동으로 불러왔습니다.
                        </span>
                      )}
                      {formErrors.author && <span className="form-error">{formErrors.author}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">전화번호 *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder="010-1234-5678"
                        readOnly={!!user?.phoneNumber}
                        style={user?.phoneNumber ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                      />
                      {user?.phoneNumber && (
                        <span style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>
                          회원 정보에서 자동으로 불러왔습니다.
                        </span>
                      )}
                      {formErrors.phone && <span className="form-error">{formErrors.phone}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="content">내용 *</label>
                      <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleFormChange}
                        placeholder="문의사항 내용을 입력해주세요"
                        rows="8"
                      ></textarea>
                      {formErrors.content && <span className="form-error">{formErrors.content}</span>}
                    </div>
                    <div className="form-actions">
                      <button type="button" onClick={() => setShowWriteForm(false)} className="btn-cancel">
                        취소
                      </button>
                      <button type="submit" className="btn-submit">
                        등록하기
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loading ? (
              <div className="contact-loading">문의사항을 불러오는 중...</div>
            ) : inquiries.length === 0 ? (
              <div className="contact-empty">등록된 문의사항이 없습니다.</div>
            ) : (
              <>
                <div className="contact-table-wrapper">
                  <table className="contact-table">
                    <thead>
                      <tr>
                        <th className="col-number">번호</th>
                        <th className="col-status">상태</th>
                        <th className="col-title">제목</th>
                        <th className="col-author">작성자</th>
                        <th className="col-date">작성일</th>
                        <th className="col-views">조회</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.map((inquiry, index) => (
                        <tr 
                          key={inquiry._id}
                          className="contact-table-row"
                          onClick={() => handleInquiryClick(inquiry)}
                        >
                          <td className="col-number">
                            {(currentPage - 1) * inquiriesPerPage + index + 1}
                          </td>
                          <td className="col-status">
                            <span className={`status-badge ${getStatusBadge(inquiry.status)}`}>
                              {inquiry.status}
                            </span>
                          </td>
                          <td className="col-title">{inquiry.title}</td>
                          <td className="col-author">
                            {getAuthorDisplay(inquiry)}
                          </td>
                          <td className="col-date">{getTimeAgo(inquiry.createdAt)}</td>
                          <td className="col-views">{inquiry.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="contact-pagination">
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

            {selectedInquiry && (
              <div className="contact-detail-modal">
                <div className="contact-detail-overlay" onClick={handleCloseDetail}></div>
                <div className="contact-detail-content">
                  <div className="contact-detail-header">
                    <h2>{selectedInquiry.title}</h2>
                    <div className="contact-detail-header-actions">
                      {user && isAuthor(selectedInquiry) && (
                        <button 
                          className="contact-detail-delete"
                          onClick={() => handleDeleteInquiry(selectedInquiry._id)}
                          title="문의사항 삭제"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      )}
                      <button 
                        className="contact-detail-close"
                        onClick={handleCloseDetail}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="contact-detail-info">
                    <div className="detail-info-item">
                      <span className="detail-label">작성자</span>
                      <span className="detail-value">
                        {getAuthorDisplay(selectedInquiry)}
                      </span>
                    </div>
                    <div className="detail-info-item">
                      <span className="detail-label">작성일</span>
                      <span className="detail-value">
                        {new Date(selectedInquiry.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="detail-info-item">
                      <span className="detail-label">상태</span>
                      <span className={`status-badge ${getStatusBadge(selectedInquiry.status)}`}>
                        {selectedInquiry.status}
                      </span>
                    </div>
                  </div>
                  <div className="contact-detail-body">
                    <div className="detail-content">
                      {selectedInquiry.content}
                    </div>
                  </div>

                  {/* 답변 섹션 */}
                  {selectedInquiry.answer && !isEditingAnswer ? (
                    <div className="contact-detail-answer">
                      <div className="answer-header">
                        <h3 className="answer-title">답변</h3>
                        <div className="answer-header-actions">
                          {user?.userType === 'admin' && (
                            <>
                              <button 
                                className="answer-edit-btn"
                                onClick={handleEditAnswer}
                                title="답변 수정"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                수정
                              </button>
                              <button 
                                className="answer-delete-btn"
                                onClick={handleDeleteAnswer}
                                title="답변 삭제"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="answer-info">
                        <span className="answer-author">
                          {selectedInquiry.answeredBy?.name || selectedInquiry.answeredBy?.userId || '관리자'}
                        </span>
                        {selectedInquiry.answeredAt && (
                          <span className="answer-date">
                            {new Date(selectedInquiry.answeredAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      <div className="answer-content">
                        {selectedInquiry.answer}
                      </div>
                    </div>
                  ) : user?.userType === 'admin' ? (
                    <div className="contact-detail-answer-form">
                      <h3 className="answer-form-title">
                        {isEditingAnswer ? '답변 수정' : '답변 작성'}
                      </h3>
                      <form onSubmit={handleAnswerSubmit}>
                        <textarea
                          className="answer-textarea"
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="답변 내용을 입력해주세요"
                          rows="6"
                        ></textarea>
                        <div className="answer-form-actions">
                          {isEditingAnswer && (
                            <button 
                              type="button"
                              className="btn-answer-cancel"
                              onClick={handleCancelEdit}
                              disabled={isSubmittingAnswer}
                            >
                              취소
                            </button>
                          )}
                          <button 
                            type="submit" 
                            className="btn-answer-submit"
                            disabled={isSubmittingAnswer || !answerText.trim()}
                          >
                            {isSubmittingAnswer ? (isEditingAnswer ? '수정 중...' : '등록 중...') : (isEditingAnswer ? '수정 완료' : '답변 등록')}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;

