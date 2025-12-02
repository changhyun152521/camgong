import { useState } from 'react';
import './LoginModal.css';
import api from '../utils/api';

const LoginModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userId.trim()) {
      newErrors.userId = '아이디를 입력해주세요.';
    }

    if (!formData.password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/users/login', formData);
      
      if (response.data.success) {
        // 토큰을 localStorage에 저장
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        
        // 사용자 이름을 포함한 환영 메시지
        const userName = response.data.data.name || response.data.data.userId;
        alert(`${userName}님 환영합니다!`);
        
        // 폼 초기화
        setFormData({
          userId: '',
          password: ''
        });
        onClose();
        // 페이지 새로고침하여 로그인 상태 반영
        window.location.reload();
      }
    } catch (error) {
      console.error('로그인 오류 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      
      if (error.response) {
        // 서버에서 응답이 온 경우
        errorMessage = error.response.data?.message || `서버 오류 (${error.response.status})`;
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
      } else {
        // 요청 설정 중 오류가 발생한 경우
        errorMessage = error.message || errorMessage;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="login-modal-overlay" onClick={handleOverlayClick}>
      <div className="login-modal-container">
        <button 
          className="login-modal-close" 
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        <form className="login-modal-form" onSubmit={handleSubmit}>
          <h2 className="login-modal-title">로그인</h2>
          <p className="login-welcome-text">캠핑공작소에 오신 것을 환영합니다</p>

          {/* 아이디, 비밀번호 - 표 형식 */}
          <div className="login-table-section">
            <div className="login-table-row">
              <input
                type="text"
                id="userId"
                name="userId"
                className={`login-table-input ${errors.userId ? 'error' : ''}`}
                placeholder="아이디 •"
                value={formData.userId}
                onChange={handleChange}
              />
              {errors.userId && <span className="error-message">{errors.userId}</span>}
            </div>

            <div className="login-table-row">
              <input
                type="password"
                id="password"
                name="password"
                className={`login-table-input ${errors.password ? 'error' : ''}`}
                placeholder="비밀번호 •"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
          </div>

          {errors.submit && (
            <div className="login-error-message">
              {errors.submit}
            </div>
          )}

          <button 
            type="submit" 
            className="login-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;

