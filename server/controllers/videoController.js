import Video from '../models/Video.js';
import axios from 'axios';
import { parseString } from 'xml2js';
import mongoose from 'mongoose';

// 유튜브 URL에서 비디오 ID 추출 및 썸네일 URL 생성
const extractVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// 유튜브 썸네일 URL 생성 (fallback 포함)
const generateThumbnailUrl = (videoId, thumbnails = null) => {
  // YouTube Data API에서 썸네일 정보를 받은 경우 우선 사용
  if (thumbnails) {
    // 최고 해상도부터 순서대로 시도
    return thumbnails.maxres?.url || 
           thumbnails.standard?.url || 
           thumbnails.high?.url || 
           thumbnails.medium?.url || 
           thumbnails.default?.url ||
           `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  
  // API 정보가 없으면 기본 썸네일 사용 (hqdefault는 항상 존재)
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// 유튜브 oEmbed API를 사용하여 영상 제목 가져오기
const fetchYouTubeTitle = async (youtubeUrl) => {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
    const response = await axios.get(oembedUrl, {
      timeout: 5000
    });
    
    if (response.data && response.data.title) {
      return response.data.title;
    }
    return null;
  } catch (error) {
    console.error('유튜브 제목 가져오기 실패:', error.message);
    return null;
  }
};

// YouTube Data API를 사용하여 영상이 Shorts인지 확인하는 함수
const isShortsVideo = async (videoId, apiKey) => {
  try {
    if (!apiKey) {
      // API 키가 없으면 제목/설명 기반 판단만 사용
      return false;
    }

    // YouTube Data API v3의 videos 엔드포인트를 사용하여 duration 확인
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoId}&part=contentDetails`;
    
    try {
      const response = await axios.get(videosUrl, {
        timeout: 5000
      });
      
      if (response.data.items && response.data.items.length > 0) {
        const duration = response.data.items[0].contentDetails?.duration;
        
        if (duration) {
          // ISO 8601 duration 형식 (예: PT1M30S = 1분 30초)을 초로 변환
          const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          if (match) {
            const hours = parseInt(match[1] || 0);
            const minutes = parseInt(match[2] || 0);
            const seconds = parseInt(match[3] || 0);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            
            // 60초 이하면 Shorts로 판단
            return totalSeconds <= 60;
          }
      }
    }
    
    return false;
    } catch (apiError) {
      console.error('YouTube Data API로 Shorts 확인 실패:', apiError.message);
      return false;
    }
  } catch (error) {
    // 오류 발생 시 기본값으로 동영상 반환
    console.error('Shorts 확인 실패:', error.message);
    return false;
  }
};

// ==================== 영상 조회 기능 ====================

// 모든 영상 조회 (공개용)
export const getAllVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // 페이지와 limit 유효성 검사
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: '페이지 번호는 1 이상이어야 합니다.'
      });
    }
    
    if (limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        message: 'limit은 1 이상 1000 이하여야 합니다.'
      });
    }
    
    console.log(`영상 조회 요청: page=${page}, limit=${limit}`);
    
    // MongoDB 연결 상태 확인
    const connectionState = mongoose.connection.readyState;
    console.log('MongoDB 연결 상태:', connectionState, {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[connectionState]);
    
    if (connectionState !== 1) {
      console.error('❌ MongoDB 연결 상태:', connectionState);
      // 연결이 안 되어 있어도 빈 배열 반환 (서버 크래시 방지)
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: 1,
        totalPages: 0,
        data: [],
        warning: 'MongoDB에 연결되지 않았습니다.'
      });
    }
    
    console.log('데이터베이스 쿼리 시작...');
    
    let videos = [];
    let total = 0;
    
    try {
      // 타임아웃 설정 (30초)
      const queryPromise = Video.find()
        .sort({ createdAt: -1 })
        .select('-__v')
        .skip(skip)
        .limit(limit)
        .lean();
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('데이터베이스 쿼리 타임아웃 (30초)')), 30000);
      });
      
      videos = await Promise.race([queryPromise, timeoutPromise]);
      
      console.log(`영상 ${videos.length}개 조회됨`);
      
      const countPromise = Video.countDocuments();
      const countTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('카운트 쿼리 타임아웃 (30초)')), 30000);
      });
      
      total = await Promise.race([countPromise, countTimeoutPromise]);
      console.log(`총 영상 수: ${total}`);
    } catch (dbError) {
      console.error('❌ 데이터베이스 쿼리 오류:', dbError);
      console.error('  오류 타입:', dbError.name);
      console.error('  오류 메시지:', dbError.message);
      throw new Error(`데이터베이스 쿼리 실패: ${dbError.message}`);
    }
    
    res.status(200).json({
      success: true,
      count: videos.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: videos
    });
  } catch (error) {
    console.error('❌ 영상 조회 오류 상세:');
    console.error('  오류 메시지:', error.message);
    console.error('  오류 이름:', error.name);
    if (error.stack) {
      console.error('  오류 스택:', error.stack);
    }
    res.status(500).json({
      success: false,
      message: error.message || '영상 목록을 불러오는 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ID로 영상 조회
export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: '영상을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 유튜브 채널 동기화 기능 ====================

// 유튜브 채널의 모든 영상 가져오기 (YouTube Data API 사용)
const fetchChannelVideos = async () => {
  try {
    const channelId = 'UCtZLTdzi3pPN4zRaIMRhQZw'; // 캠핑공작소CGRV 채널 ID
    
    // YouTube Data API를 사용하여 모든 영상 가져오기
    // API 키 확인 및 로깅
    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    console.log('=== YouTube API 키 확인 ===');
    console.log('API 키 존재 여부:', apiKey ? '있음' : '없음');
    if (apiKey) {
      console.log('API 키 길이:', apiKey.length);
      console.log('API 키 앞 10자리:', apiKey.substring(0, 10) + '...');
    }
    
    if (!apiKey || apiKey === 'your-youtube-api-key-here' || apiKey === '여기에_API_키_입력하세요' || apiKey.length < 20) {
      console.log('⚠️ API 키가 유효하지 않습니다.');
      console.log('  현재 API 키 값:', apiKey ? `"${apiKey.substring(0, 30)}..."` : '없음');
      console.log('  API 키 길이:', apiKey ? apiKey.length : 0);
      console.log('  RSS 피드를 사용합니다. (제한적 - 일부 영상만 가져올 수 있음)');
      // API 키가 없으면 RSS 피드 사용 (제한적)
      return await fetchChannelVideosFromRSS(channelId);
    }
    
    console.log('✅ YouTube Data API를 사용하여 영상을 가져옵니다.');
    
    // 채널의 업로드 플레이리스트 ID 가져오기
    let uploadsPlaylistId;
    try {
      const channelResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=contentDetails`,
        { timeout: 15000 }
      );
      
      if (channelResponse.data.error) {
        console.error('❌ YouTube API 오류:', channelResponse.data.error);
        throw new Error(`YouTube API 오류: ${channelResponse.data.error.message || '알 수 없는 오류'}`);
      }
      
      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        throw new Error('채널을 찾을 수 없습니다. 채널 ID를 확인해주세요.');
      }
      
      uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;
      
      if (!uploadsPlaylistId) {
        throw new Error('업로드 플레이리스트를 찾을 수 없습니다.');
      }
      
      console.log('✅ 업로드 플레이리스트 ID:', uploadsPlaylistId);
    } catch (error) {
      if (error.response) {
        console.error('❌ YouTube API 응답 오류:');
        console.error('  상태 코드:', error.response.status);
        console.error('  오류 메시지:', error.response.data?.error?.message);
        console.error('  오류 상세:', JSON.stringify(error.response.data?.error, null, 2));
        
        // API 키 관련 오류인 경우
        if (error.response.status === 403 || error.response.status === 401) {
          console.error('  ⚠️ API 키 인증 오류입니다. API 키와 권한을 확인해주세요.');
        }
        
        throw new Error(`YouTube API 오류 (${error.response.status}): ${error.response.data?.error?.message || '알 수 없는 오류'}`);
      }
      throw error;
    }
    
    // 플레이리스트의 모든 영상 가져오기
    const allVideos = [];
    let nextPageToken = null;
    let pageCount = 0;
    const maxRetries = 3; // 최대 재시도 횟수
    
    do {
      pageCount++;
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${uploadsPlaylistId}&part=snippet,contentDetails&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      console.log(`📄 플레이리스트 페이지 ${pageCount} 가져오는 중...${nextPageToken ? ` (토큰: ${nextPageToken.substring(0, 20)}...)` : ''}`);
      
      let response;
      let retryCount = 0;
      let success = false;
      
      // 재시도 로직
      while (retryCount < maxRetries && !success) {
        try {
          if (retryCount > 0) {
            console.log(`  ⚠️ 재시도 ${retryCount}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 재시도 간격 증가
          }
          
          response = await axios.get(playlistUrl, {
            timeout: 30000 // 타임아웃을 30초로 증가
          });
          
          if (response.data.error) {
            console.error('❌ YouTube API 오류:', response.data.error);
            throw new Error(`YouTube API 오류: ${response.data.error.message || '알 수 없는 오류'}`);
          }
          
          success = true;
        } catch (error) {
          retryCount++;
          
          if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data?.error;
            
            // 403, 401은 재시도 불가 (인증 문제)
            if (status === 403 || status === 401) {
              console.error('❌ YouTube API 인증 오류 (재시도 불가):');
              console.error('  상태 코드:', status);
              console.error('  오류 메시지:', errorData?.message);
              console.error('  오류 상세:', JSON.stringify(errorData, null, 2));
              throw new Error(`YouTube API 인증 오류 (${status}): ${errorData?.message || '알 수 없는 오류'}`);
            }
            
            // 429 (Too Many Requests)는 재시도
            if (status === 429 && retryCount < maxRetries) {
              const retryAfter = error.response.headers['retry-after'] || 5;
              console.warn(`  ⚠️ API 할당량 초과. ${retryAfter}초 후 재시도...`);
              await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
              continue;
            }
            
            // 기타 오류
            if (retryCount >= maxRetries) {
              console.error('❌ YouTube API 응답 오류 (플레이리스트 페이지):');
              console.error('  상태 코드:', status);
              console.error('  오류 메시지:', errorData?.message);
              console.error('  오류 상세:', JSON.stringify(errorData, null, 2));
              throw new Error(`YouTube API 오류 (${status}): ${errorData?.message || '알 수 없는 오류'}`);
            }
          } else if (retryCount >= maxRetries) {
            // 네트워크 오류 등
            console.error('❌ 네트워크 오류:', error.message);
            throw error;
          }
        }
      }
      
      // 응답 데이터 확인
      if (!response || !response.data) {
        console.error('❌ 응답 데이터가 없습니다.');
        break;
      }
      
      if (response.data.items && response.data.items.length > 0) {
        console.log(`  ✅ ${response.data.items.length}개의 영상 항목 발견`);
        
        for (const item of response.data.items) {
          try {
            const videoId = item.contentDetails.videoId;
            const title = item.snippet.title;
            const published = item.snippet.publishedAt;
            const description = item.snippet.description || '';
            const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
            
            // 영상이 Shorts인지 확인
            let isShorts = false;
            
            // 1단계: 제목이나 설명에 #Shorts가 있는지 확인 (빠른 체크)
            if (description.includes('#Shorts') || 
                title.includes('#Shorts') ||
                description.includes('#shorts') ||
                title.includes('#shorts') ||
                description.includes('#SHORTS') ||
                title.includes('#SHORTS')) {
              isShorts = true;
            } else {
              // 2단계: YouTube Data API를 사용하여 duration 확인 (정확한 판단)
              // 배치로 처리하기 위해 videoId를 수집한 후 한 번에 확인
              // 여기서는 개별 확인 (성능 최적화를 위해 나중에 배치 처리로 개선 가능)
              try {
                isShorts = await isShortsVideo(videoId, apiKey);
              } catch (shortsError) {
                // API 호출 실패 시 기본값으로 동영상
                console.warn(`영상 ${videoId}의 Shorts 확인 실패, 기본값(동영상) 사용:`, shortsError.message);
              isShorts = false;
              }
            }
            
            // 게시 시간 파싱
            let publishedDate = null;
            if (published) {
              try {
                publishedDate = new Date(published);
                if (isNaN(publishedDate.getTime())) {
                  publishedDate = null;
                }
              } catch (dateError) {
                console.error('날짜 파싱 오류:', dateError);
                publishedDate = null;
              }
            }
            
            // 썸네일 정보 가져오기 (YouTube Data API에서)
            const thumbnails = item.snippet.thumbnails;
            
            allVideos.push({
              videoId,
              title,
              youtubeUrl,
              thumbnailUrl: generateThumbnailUrl(videoId, thumbnails),
              videoFormat: isShorts ? '쇼츠' : '동영상',
              publishedDate: publishedDate || new Date()
            });
          } catch (itemError) {
            console.error('영상 항목 처리 오류:', itemError);
          }
        }
      } else {
        console.warn(`  ⚠️ 이 페이지에 영상 항목이 없습니다.`);
      }
      
      // nextPageToken 업데이트
      nextPageToken = response.data.nextPageToken;
      
      // 페이지 정보 로깅
      const pageInfo = response.data.pageInfo;
      if (pageInfo) {
        console.log(`  📊 페이지 정보: 총 결과 ${pageInfo.totalResults}개, 페이지당 ${pageInfo.resultsPerPage}개`);
      }
      
      console.log(`📹 현재까지 ${allVideos.length}개 영상 수집됨 (페이지 토큰: ${nextPageToken ? `있음 (${nextPageToken.substring(0, 20)}...) - 다음 페이지 있음` : '없음 - 마지막 페이지'})`);
      
      // API 호출 제한을 피하기 위해 약간의 지연 (페이지 간)
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 300)); // 300ms로 증가
      }
      
      // 무한 루프 방지 (최대 1000페이지)
      if (pageCount >= 1000) {
        console.warn('⚠️ 최대 페이지 수(1000)에 도달했습니다. 더 많은 영상이 있을 수 있습니다.');
        break;
      }
    } while (nextPageToken);
    
    console.log(`✅ 총 ${allVideos.length}개의 영상을 가져왔습니다. (${pageCount}페이지 처리 완료)`);
    
    if (allVideos.length === 0) {
      console.warn('⚠️ 가져온 영상이 없습니다. 채널에 영상이 있는지 확인해주세요.');
    } else {
      console.log(`📈 영상 통계:`);
      console.log(`   - 동영상: ${allVideos.filter(v => v.videoFormat === '동영상').length}개`);
      console.log(`   - 쇼츠: ${allVideos.filter(v => v.videoFormat === '쇼츠').length}개`);
    }
    
    return allVideos;
  } catch (error) {
    console.error('❌ YouTube Data API 오류 발생:');
    if (error.response) {
      console.error('  상태 코드:', error.response.status);
      console.error('  오류 메시지:', error.response.data?.error?.message);
      console.error('  오류 상세:', JSON.stringify(error.response.data?.error, null, 2));
      
      // API 키 관련 오류인 경우
      if (error.response.status === 403 || error.response.status === 401) {
        console.error('  ⚠️ API 키 인증 오류입니다. API 키와 권한을 확인해주세요.');
        console.error('  - API 키가 올바른지 확인');
        console.error('  - YouTube Data API v3가 활성화되어 있는지 확인');
        console.error('  - API 키에 올바른 제한사항이 설정되어 있는지 확인');
      }
    } else {
      console.error('  오류 메시지:', error.message);
      console.error('  오류 스택:', error.stack);
    }
    console.error('⚠️ RSS 피드로 전환합니다.');
    // API 오류 시 RSS 피드 사용
    try {
      return await fetchChannelVideosFromRSS('UCtZLTdzi3pPN4zRaIMRhQZw');
    } catch (rssError) {
      console.error('❌ RSS 피드도 실패했습니다:', rssError.message);
      throw new Error(`영상 가져오기 실패: ${error.message}`);
    }
  }
};

// RSS 피드를 사용하여 채널 영상 가져오기 (백업 방법)
const fetchChannelVideosFromRSS = async (channelId) => {
  try {
    const videosRssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    
    const response = await axios.get(videosRssUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // XML 파싱
    return new Promise(async (resolve, reject) => {
      parseString(response.data, async (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        const videos = [];
        if (result.feed && result.feed.entry) {
          // 각 영상에 대해 순차적으로 처리 (API 호출 제한 고려)
          for (const entry of result.feed.entry) {
            try {
              const videoId = entry['yt:videoId']?.[0];
              const title = entry.title?.[0];
              const link = entry.link?.[0]?.$.href;
              const published = entry.published?.[0]; // 게시 시간
              
              if (videoId && title && link) {
                // 영상이 Shorts인지 확인 (RSS 피드에서는 API 키가 없을 수 있음)
                const apiKey = process.env.YOUTUBE_API_KEY?.trim();
                const isShorts = await isShortsVideo(videoId, apiKey);
                
                // 게시 시간 파싱 (ISO 8601 형식)
                let publishedDate = null;
                if (published) {
                  try {
                    publishedDate = new Date(published);
                    // 유효한 날짜인지 확인
                    if (isNaN(publishedDate.getTime())) {
                      publishedDate = null;
                    }
                  } catch (dateError) {
                    console.error('날짜 파싱 오류:', dateError);
                    publishedDate = null;
                  }
                }
                
                videos.push({
                  videoId,
                  title,
                  youtubeUrl: link,
                  thumbnailUrl: generateThumbnailUrl(videoId),
                  videoFormat: isShorts ? '쇼츠' : '동영상',
                  publishedDate: publishedDate || new Date() // 게시 시간이 없으면 현재 시간 사용
                });
                
                // API 호출 제한을 피하기 위해 약간의 지연
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            } catch (entryError) {
              console.error('영상 항목 파싱 오류:', entryError);
            }
          }
        }
        
        resolve(videos);
      });
    });
  } catch (error) {
    console.error('채널 영상 가져오기 실패:', error.message);
    throw error;
  }
};

// 유튜브 채널 동기화
export const syncChannelVideos = async (req, res) => {
  try {
    console.log('=== 채널 동기화 시작 ===');
    const startTime = Date.now();
    
    const channelVideos = await fetchChannelVideos();
    
    if (channelVideos.length === 0) {
      console.error('❌ 채널에서 영상을 가져오지 못했습니다.');
      return res.status(400).json({
        success: false,
        message: '채널에서 영상을 가져올 수 없습니다. API 키를 확인하거나 서버 로그를 확인해주세요.'
      });
    }

    console.log(`📦 ${channelVideos.length}개의 영상을 데이터베이스에 저장/업데이트 중...`);

    const syncedVideos = [];
    const updatedVideos = [];
    const errors = [];

    for (const videoData of channelVideos) {
      try {
        // 이미 존재하는 영상인지 확인 (youtubeUrl 또는 videoId로)
        const existingVideo = await Video.findOne({ 
          $or: [
            { youtubeUrl: videoData.youtubeUrl },
            { youtubeUrl: { $regex: videoData.videoId, $options: 'i' } }
          ]
        });

        if (existingVideo) {
          // 기존 영상의 제목, 썸네일, 영상 형식 업데이트 (타입은 유지)
          existingVideo.title = videoData.title;
          existingVideo.thumbnailUrl = videoData.thumbnailUrl;
          existingVideo.videoFormat = videoData.videoFormat || existingVideo.videoFormat;
          // 게시 시간도 업데이트 (유튜브 게시 시간이 더 정확할 수 있음)
          if (videoData.publishedDate) {
            existingVideo.publishedAt = videoData.publishedDate;
          }
          await existingVideo.save();
          updatedVideos.push(existingVideo);
          continue;
        }

        // 새 영상 생성
        const video = new Video({
          title: videoData.title,
          youtubeUrl: videoData.youtubeUrl,
          thumbnailUrl: videoData.thumbnailUrl,
          videoType: '기타', // 기본값
          videoFormat: videoData.videoFormat || '동영상', // 자동으로 감지된 형식 사용
          publishedAt: videoData.publishedDate || new Date() // 유튜브 게시 시간 사용
        });

        const savedVideo = await video.save();
        syncedVideos.push(savedVideo);
      } catch (error) {
        console.error('영상 저장 오류:', error);
        errors.push({
          title: videoData.title,
          error: error.message
        });
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ 동기화 완료: ${syncedVideos.length}개 추가, ${updatedVideos.length}개 업데이트 (소요 시간: ${duration}초)`);
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length}개의 영상 처리 중 오류 발생`);
    }

    res.status(200).json({
      success: true,
      message: `총 ${syncedVideos.length}개의 새 영상이 추가되고, ${updatedVideos.length}개의 기존 영상이 업데이트되었습니다.`,
      data: {
        synced: syncedVideos.length,
        updated: updatedVideos.length,
        total: channelVideos.length,
        errors: errors.length,
        errorDetails: errors.length > 0 ? errors : undefined,
        duration: `${duration}초`
      }
    });
  } catch (error) {
    console.error('채널 동기화 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '채널 동기화 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ==================== 영상 생성 기능 ====================

export const createVideo = async (req, res) => {
  try {
    const { title, youtubeUrl, videoType, videoFormat } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: '유튜브 링크는 필수입니다.'
      });
    }

    if (!videoType || !['자작솜씨', '자작강의', '기타'].includes(videoType)) {
      return res.status(400).json({
        success: false,
        message: '영상 타입은 자작솜씨, 자작강의, 기타 중 하나여야 합니다.'
      });
    }

    if (!videoFormat || !['동영상', '쇼츠'].includes(videoFormat)) {
      return res.status(400).json({
        success: false,
        message: '영상 형식은 동영상 또는 쇼츠 중 하나여야 합니다.'
      });
    }

    // 유튜브 비디오 ID 추출
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: '유효한 유튜브 URL을 입력해주세요.'
      });
    }

    // 제목이 제공되지 않으면 유튜브에서 자동으로 가져오기
    let finalTitle = title;
    if (!finalTitle || finalTitle.trim() === '') {
      finalTitle = await fetchYouTubeTitle(youtubeUrl);
      if (!finalTitle) {
        return res.status(400).json({
          success: false,
          message: '유튜브 영상 제목을 가져올 수 없습니다. 제목을 직접 입력해주세요.'
        });
      }
    }

    // 썸네일 URL 생성
    const thumbnailUrl = generateThumbnailUrl(videoId);

    const video = new Video({
      title: finalTitle,
      youtubeUrl,
      thumbnailUrl,
      videoType,
      videoFormat
    });

    const savedVideo = await video.save();

    res.status(201).json({
      success: true,
      message: '영상이 추가되었습니다.',
      data: savedVideo
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 영상 수정 기능 ====================

// 영상 타입만 수정하는 함수
export const updateVideoType = async (req, res) => {
  try {
    const { id } = req.params;
    const { videoType } = req.body;

    if (!videoType || !['자작솜씨', '자작강의', '기타'].includes(videoType)) {
      return res.status(400).json({
        success: false,
        message: '영상 타입은 자작솜씨, 자작강의, 기타 중 하나여야 합니다.'
      });
    }

    const video = await Video.findByIdAndUpdate(
      id,
      { videoType },
      { new: true, runValidators: true }
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: '영상을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '영상 타입이 수정되었습니다.',
      data: video
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, youtubeUrl, videoType, videoFormat } = req.body;

    const updateData = {};
    
    // 유튜브 URL이 변경된 경우
    if (youtubeUrl) {
      const videoId = extractVideoId(youtubeUrl);
      if (!videoId) {
        return res.status(400).json({
          success: false,
          message: '유효한 유튜브 URL을 입력해주세요.'
        });
      }
      updateData.youtubeUrl = youtubeUrl;
      updateData.thumbnailUrl = generateThumbnailUrl(videoId);
      
      // 제목이 제공되지 않았거나, 유튜브 URL이 변경된 경우 자동으로 제목 가져오기
      if (!title || title.trim() === '') {
        const fetchedTitle = await fetchYouTubeTitle(youtubeUrl);
        if (fetchedTitle) {
          updateData.title = fetchedTitle;
        }
      } else {
        updateData.title = title;
      }
    } else if (title) {
      // 유튜브 URL이 변경되지 않았지만 제목만 변경하는 경우
      updateData.title = title;
    }
    
    if (videoType) {
      if (!['자작솜씨', '자작강의', '기타'].includes(videoType)) {
        return res.status(400).json({
          success: false,
          message: '영상 타입은 자작솜씨, 자작강의, 기타 중 하나여야 합니다.'
        });
      }
      updateData.videoType = videoType;
    }
    
    if (videoFormat) {
      if (!['동영상', '쇼츠'].includes(videoFormat)) {
        return res.status(400).json({
          success: false,
          message: '영상 형식은 동영상 또는 쇼츠 중 하나여야 합니다.'
        });
      }
      updateData.videoFormat = videoFormat;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '수정할 데이터가 없습니다.'
      });
    }

    const video = await Video.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: '영상을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '영상이 수정되었습니다.',
      data: video
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 영상 삭제 기능 ====================

export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findByIdAndDelete(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: '영상을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '영상이 삭제되었습니다.',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
