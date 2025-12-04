import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 라우트가 변경될 때마다 페이지 상단으로 스크롤
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // 즉시 이동 (smooth보다 빠름)
    });
  }, [pathname]);

  return null; // 이 컴포넌트는 렌더링할 내용이 없음
};

export default ScrollToTop;

