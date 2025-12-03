import { useState } from 'react';
import './SignupModal.css';
import api from '../utils/api';

const SignupModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    confirmPassword: '',
    name: '',
    phoneNumber: ''
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
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    } else {
      // 영문과 숫자 포함 여부 확인
      const hasLetter = /[A-Za-z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      
      if (!hasLetter || !hasNumber) {
        newErrors.password = '비밀번호는 영문과 숫자를 포함해야 합니다.';
      }
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    // 전화번호는 선택 항목이므로 필수 검증 제거
    // 전화번호 형식 검증 (입력한 경우에만)
    if (formData.phoneNumber.trim()) {
      const phoneRegex = /^010-?\d{4}-?\d{4}$/;
      const normalizedPhone = formData.phoneNumber.replace(/[-\s]/g, '');
      if (!phoneRegex.test(normalizedPhone)) {
        newErrors.phoneNumber = '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
      }
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
      // confirmPassword는 서버로 보내지 않음
      // 전화번호가 비어있으면 빈 문자열로 전송
      const { confirmPassword, ...userData } = formData;
      if (!userData.phoneNumber || !userData.phoneNumber.trim()) {
        userData.phoneNumber = '';
      }
      const response = await api.post('/users', userData);
      
      if (response.data.success) {
        alert('회원가입이 완료되었습니다!');
        // 폼 초기화
        setFormData({
          userId: '',
          password: '',
          confirmPassword: '',
          name: '',
          phoneNumber: ''
        });
        onClose();
      }
    } catch (error) {
      console.error('회원가입 오류 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      
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
      
      alert(errorMessage);
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
    <div className="signup-modal-overlay" onClick={handleOverlayClick}>
      <div className="signup-modal-container">
        <button 
          className="signup-modal-close" 
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        <form className="signup-modal-form" onSubmit={handleSubmit}>
          <h2 className="signup-modal-title">회원가입</h2>
          <p className="signup-welcome-text">캠핑공작소에 오신 것을 환영합니다</p>

          {/* 아이디, 비밀번호, 비밀번호 확인 - 표 형식 */}
          <div className="signup-table-section">
            <div className="signup-table-row">
              <input
                type="text"
                id="userId"
                name="userId"
                className={`signup-table-input ${errors.userId ? 'error' : ''}`}
                placeholder="아이디 •"
                value={formData.userId}
                onChange={handleChange}
              />
              {errors.userId && <span className="error-message">{errors.userId}</span>}
            </div>

            <div className="signup-table-row">
              <input
                type="password"
                id="password"
                name="password"
                className={`signup-table-input ${errors.password ? 'error' : ''}`}
                placeholder="비밀번호 •"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="signup-table-row">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`signup-table-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="비밀번호 확인 •"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>
          <p className="signup-form-hint">6자리 이상의 영문, 숫자를 사용해 주세요.</p>

          {/* 이름, 전화번호 - 별도 섹션 */}
          <div className="signup-info-section">
            <div className="signup-info-row">
              <input
                type="text"
                id="name"
                name="name"
                className={`signup-info-input ${errors.name ? 'error' : ''}`}
                placeholder="이름 •"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="signup-info-row">
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                className={`signup-info-input ${errors.phoneNumber ? 'error' : ''}`}
                placeholder="전화번호 (선택)"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
              <p className="signup-phone-hint">
                전화번호는 선택 항목입니다. 제공하지 않아도 서비스 이용이 가능하며, 
                비밀번호 재설정 등 일부 기능은 제한될 수 있습니다.
              </p>
            </div>
          </div>

          {/* 개인정보 처리방침 안내 */}
          <div className="signup-privacy-notice">
            <p className="signup-privacy-text">
              회원가입 시 <span className="signup-privacy-link">개인정보 처리방침</span>에 동의하는 것으로 간주됩니다.
            </p>
            <p className="signup-privacy-detail">
              • 수집 항목: 아이디, 비밀번호, 이름, 전화번호(선택)<br/>
              • 수집 목적: 서비스 제공, 회원 관리, 문의사항 답변<br/>
              • 보관 기간: 회원 탈퇴 시까지<br/>
              • 전화번호는 선택 항목이며, 제공하지 않아도 서비스 이용이 가능합니다.
            </p>
          </div>

          <button 
            type="submit" 
            className="signup-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '가입 중...' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupModal;

