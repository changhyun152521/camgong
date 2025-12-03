import { useState, useEffect } from 'react';
import './MobileConsultButton.css';

const MobileConsultButton = () => {
  const phoneNumber = '070-4408-5500';
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('.main-footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        // Footer의 상단이 화면 하단에 도달하거나 그 위에 있으면 버튼 숨김
        // 약간의 여유를 두기 위해 100px 여유 공간 추가
        const isFooterNearBottom = footerRect.top <= windowHeight - 100;
        setIsVisible(!isFooterNearBottom);
      }
    };

    // 초기 체크
    handleScroll();

    // 스크롤 이벤트 리스너 추가 (디바운싱)
    let timeoutId;
    const debouncedHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 50);
    };

    window.addEventListener('scroll', debouncedHandleScroll, { passive: true });
    window.addEventListener('resize', debouncedHandleScroll);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', debouncedHandleScroll);
      window.removeEventListener('resize', debouncedHandleScroll);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <a 
      href={`tel:${phoneNumber}`}
      className="mobile-consult-button"
      aria-label="상담문의 전화하기"
    >
      <svg 
        className="phone-icon" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
      </svg>
      <span className="button-text">상담문의</span>
    </a>
  );
};

export default MobileConsultButton;

