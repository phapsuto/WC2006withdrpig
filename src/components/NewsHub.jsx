import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card, Tag, Button, Skeleton, Empty, Breadcrumb, Typography, Divider, ConfigProvider, Pagination } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, ReadOutlined, UserOutlined, LinkOutlined, ArrowLeftOutlined, FireOutlined, RightOutlined } from '@ant-design/icons';
import { backendClient } from '../services/backendClient';

const { Text, Title } = Typography;

// ─── Slug Generation ─────────────────────────────────────────────────────────
const generateSlug = (text, id) => {
  if (!text) return id;
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') + '-' + id;
};

// ─── Source badge colors ─────────────────────────────────────────────────────
const SOURCE_CONFIG = {
  'VnExpress':   { color: '#0066b3' },
  'Tuổi Trẻ':   { color: '#e02020' },
  'Thanh Niên':  { color: '#1a73e8' },
  'BongDaPlus':  { color: '#d4380d' },
};

const getSourceColor = (source) => SOURCE_CONFIG[source]?.color || '#6b7280';

// ─── HTML Helpers ────────────────────────────────────────────────────────────
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

const getReadingTime = (text) => {
  if (!text) return 2;
  return Math.max(1, Math.ceil(stripHtml(text).split(/\s+/).length / 150));
};

const formatTimeAgo = (pubDate) => {
  if (!pubDate) return '';
  const diff = Date.now() - pubDate;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop';

// ─── Antd Theme ──────────────────────────────────────────────────────────────
const newsTheme = {
  token: {
    fontFamily: '"365 Sans", -apple-system, sans-serif',
    colorPrimary: '#ea4c89',
    borderRadius: 10,
    fontSize: 14,
  },
  components: {
    Card: {
      paddingLG: 0,
      borderRadiusLG: 12,
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Button: {
      borderRadius: 20,
      controlHeight: 34,
      fontSize: 13,
    },
    Breadcrumb: {
      fontSize: 13,
    },
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// SOURCE TAG COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
function SourceTag({ source, size = 'small' }) {
  const color = getSourceColor(source);
  return (
    <Tag
      color={color}
      style={{
        fontSize: size === 'small' ? 11 : 12,
        lineHeight: size === 'small' ? '18px' : '20px',
        padding: size === 'small' ? '0 6px' : '0 8px',
        fontWeight: 600,
        letterSpacing: 0.2,
        textTransform: 'uppercase',
        border: 'none',
        borderRadius: 4,
        margin: 0,
      }}
    >
      {source}
    </Tag>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FEATURED CARD — Hero article
// ═════════════════════════════════════════════════════════════════════════════
function FeaturedCard({ article, onClick, imgErrors, onImgError }) {
  const img = imgErrors[article.id] ? FALLBACK_IMG : (article.image || FALLBACK_IMG);
  const excerpt = stripHtml(article.contentVi || article.content || '').substring(0, 180);

  return (
    <div
      className="group grid grid-cols-1 md:grid-cols-2 bg-white rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/10] md:aspect-auto">
        <img
          src={img}
          alt=""
          onError={() => onImgError(article.id)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-2.5 left-2.5">
          <SourceTag source={article.source} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col justify-center gap-2.5">
        <h2
          className="text-[16px] font-medium leading-[1.45] text-[--365-text-main] m-0 line-clamp-3 group-hover:text-[--color-primary] transition-colors duration-200"
        >
          {article.titleVi || article.title}
        </h2>
        <p className="text-[13px] leading-[1.6] text-[--365-text-sub] m-0 line-clamp-3">
          {excerpt}...
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <ClockCircleOutlined className="text-[11px] text-[--365-text-sub]" />
          <Text className="!text-[12px] !text-[--365-text-sub] !font-medium">{formatTimeAgo(article.pubDate)}</Text>
          <span className="text-[--365-text-sub] text-[11px]">·</span>
          <ReadOutlined className="text-[11px] text-[--365-text-sub]" />
          <Text className="!text-[12px] !text-[--365-text-sub] !font-medium">{getReadingTime(article.content)} phút đọc</Text>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// NEWS LIST ITEM — Horizontal card
// ═════════════════════════════════════════════════════════════════════════════
function NewsListItem({ article, onClick, imgErrors, onImgError }) {
  const img = imgErrors[article.id] ? FALLBACK_IMG : (article.image || FALLBACK_IMG);
  const excerpt = stripHtml(article.contentVi || article.content || '').substring(0, 120);

  return (
    <div
      className="group flex gap-3.5 py-3.5 px-4 cursor-pointer hover:bg-[#fafafa] transition-colors duration-150 rounded-lg -mx-1"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="w-[160px] h-[100px] flex-shrink-0 rounded-lg overflow-hidden">
        <img
          src={img}
          alt=""
          onError={() => onImgError(article.id)}
          className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.05]"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col justify-center min-w-0 flex-1 gap-1.5">
        <h3 className="text-[14px] font-medium leading-[1.45] text-[--365-text-main] m-0 line-clamp-2 group-hover:text-[--color-primary] transition-colors duration-150">
          {article.titleVi || article.title}
        </h3>
        <p className="text-[13px] leading-[1.55] text-[--365-text-sub] m-0 line-clamp-2 hidden sm:block">
          {excerpt}...
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <SourceTag source={article.source} size="small" />
          <Text className="!text-[12px] !text-[#9ca3af] !font-medium">{formatTimeAgo(article.pubDate)}</Text>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SIDEBAR TRENDING ITEM
// ═════════════════════════════════════════════════════════════════════════════
function SidebarItem({ article, rank, onClick, imgErrors, onImgError }) {
  const img = imgErrors[article.id] ? FALLBACK_IMG : (article.image || FALLBACK_IMG);

  return (
    <div
      className="group flex gap-2.5 py-2 cursor-pointer"
      onClick={onClick}
    >
      {/* Rank */}
      <span
        className="text-[16px] font-semibold min-w-[24px] pt-0.5 leading-none"
        style={{ color: rank <= 3 ? '#ea4c89' : '#d1d5db' }}
      >
        {String(rank).padStart(2, '0')}
      </span>

      {/* Thumbnail */}
      <div className="w-[64px] h-[44px] flex-shrink-0 rounded-md overflow-hidden">
        <img
          src={img}
          alt=""
          onError={() => onImgError(article.id)}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-medium leading-[1.4] text-[--365-text-main] m-0 line-clamp-2 group-hover:text-[--color-primary] transition-colors duration-150">
          {article.titleVi || article.title}
        </h4>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="w-[6px] h-[6px] rounded-full flex-shrink-0"
            style={{ background: getSourceColor(article.source) }}
          />
          <Text className="!text-[11px] !text-[#9ca3af] !font-medium">
            {article.source} · {formatTimeAgo(article.pubDate)}
          </Text>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RELATED ITEM — For detail sidebar + mobile
// ═════════════════════════════════════════════════════════════════════════════
function RelatedItem({ article, onClick, imgErrors, onImgError }) {
  const img = imgErrors[article.id] ? FALLBACK_IMG : (article.image || FALLBACK_IMG);

  return (
    <div
      className="group flex gap-3 py-2.5 cursor-pointer border-b border-[#f3f3f3] last:border-b-0"
      onClick={onClick}
    >
      <div className="w-[80px] h-[54px] flex-shrink-0 rounded-md overflow-hidden">
        <img
          src={img}
          alt=""
          onError={() => onImgError(article.id)}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="text-[13px] font-medium leading-[1.4] text-[--365-text-main] m-0 line-clamp-2 group-hover:text-[--color-primary] transition-colors duration-150">
          {article.titleVi || article.title}
        </h4>
        <Text className="!text-[11px] !text-[#9ca3af] !font-medium mt-1">{formatTimeAgo(article.pubDate)}</Text>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SKELETON LOADING
// ═════════════════════════════════════════════════════════════════════════════
function NewsSkeletons() {
  return (
    <div className="flex flex-col gap-3">
      {/* Featured skeleton */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <Skeleton.Image active style={{ width: '100%', height: 200, display: 'block' }} />
        <div className="p-4">
          <Skeleton active paragraph={{ rows: 2 }} title={{ width: '80%' }} />
        </div>
      </div>
      {/* List skeletons */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-3 p-3 bg-white rounded-xl shadow-sm">
          <Skeleton.Image active style={{ width: 140, height: 88, borderRadius: 8, flexShrink: 0 }} />
          <div className="flex-1">
            <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function NewsHub({ matches = [] }) {
  const [articles, setArticles] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [firstLoadDone, setFirstLoadDone] = useState(false);
  const [imgErrors, setImgErrors] = useState({});

  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page')) || 1;

  const location = useLocation();
  const [detailArticle, setDetailArticle] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!slug) {
      setDetailArticle(null);
      return;
    }
    
    // Quick find in current list
    const found = articles.find(a => a.slug === slug || generateSlug(a.titleVi || a.title, a.id) === slug);
    if (found) {
      setDetailArticle(found);
      return;
    }

    // Not in current list, fetch from server
    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const data = await backendClient.getNewsBySlug(slug);
        if (data.success) {
          setDetailArticle(data.article);
        }
      } catch (e) {
        console.error('Failed to load article detail:', e);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [slug, articles]);

  const loadNews = useCallback(async (isManual = false) => {
    if (isManual || !firstLoadDone) setLoading(true);
    try {
      const data = await backendClient.getAllNews(currentPage, 12);
      if (data.success) {
        setArticles(data.docs || data.news || []);
        setTotalDocs(data.totalDocs || 0);
      }
      setFirstLoadDone(true);
    } catch (e) {
      console.error('News load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [firstLoadDone, currentPage]);

  useEffect(() => { loadNews(false); }, [loadNews]);

  useEffect(() => {
    const hasLive = matches.some(m => m.status === 'LIVE');
    const interval = setInterval(() => loadNews(false), hasLive ? 5 * 60000 : 20 * 60000);
    return () => clearInterval(interval);
  }, [matches, loadNews]);

  const handlePageChange = (page) => {
    setSearchParams({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCardClick = (article) => {
    const articleSlug = article.slug || generateSlug(article.titleVi || article.title, article.id);
    navigate(`/news/${articleSlug}`, { state: { fromPage: currentPage } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImgError = (id) => setImgErrors(prev => ({ ...prev, [id]: true }));
  const getImg = (article) => imgErrors[article.id] ? FALLBACK_IMG : (article.image || FALLBACK_IMG);

  // ═══════════════════════════════════════════════════════════════════════════
  // ARTICLE DETAIL VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (detailLoading) {
    return (
      <ConfigProvider theme={newsTheme}>
        <div className="font-sans max-w-4xl mx-auto py-8">
          <Skeleton active paragraph={{ rows: 12 }} />
        </div>
      </ConfigProvider>
    );
  }

  if (detailArticle) {
    const readingTime = getReadingTime(detailArticle.contentVi || detailArticle.content);
    const relatedArticles = articles.filter(a => a.id !== detailArticle.id).slice(0, 8);
    const contentHtml = detailArticle.contentVi || detailArticle.content || '';
    const showCover = !(contentHtml.trim().startsWith('<p><img') || contentHtml.trim().startsWith('<figure') || contentHtml.trim().startsWith('<img'));
    
    const backPage = location.state?.fromPage || 1;

    return (
      <ConfigProvider theme={newsTheme}>
        <div className="font-sans">
          {/* Breadcrumb */}
          <Breadcrumb
            className="mb-3"
            items={[
              {
                title: (
                  <a onClick={() => navigate(`/news?page=${backPage}`)} className="flex items-center gap-1 cursor-pointer text-[--color-primary] text-[13px] font-medium">
                    <ReadOutlined className="text-[12px]" /> Tin tức
                  </a>
                ),
              },
              {
                title: <span className="text-[13px] text-[--365-text-sub] font-medium">{detailArticle.source}</span>,
              },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3.5">
            {/* Main Article Column */}
            <div>
              <Card
                className="!rounded-xl overflow-hidden"
                styles={{ body: { padding: 0 } }}
              >
                {/* Article Header */}
                <div className="px-5 pt-5 pb-0">
                  {/* Meta row */}
                  <div className="flex items-center flex-wrap gap-2.5 mb-3">
                    <SourceTag source={detailArticle.source} size="normal" />
                    <div className="flex items-center gap-1.5 text-[12px] text-[--365-text-sub] font-medium">
                      <ClockCircleOutlined className="text-[11px]" />
                      <span>{detailArticle.pubDateStr}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[--365-text-sub] font-medium">
                      <ReadOutlined className="text-[11px]" />
                      <span>{readingTime} phút đọc</span>
                    </div>
                    {detailArticle.author && (
                      <div className="flex items-center gap-1.5 text-[12px] text-[--365-text-sub] font-medium">
                        <UserOutlined className="text-[11px]" />
                        <span>{detailArticle.author}</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-[22px] sm:text-[24px] font-semibold leading-[1.4] text-[--365-text-main] m-0 mb-2">
                    {detailArticle.titleVi || detailArticle.title}
                  </h1>

                  {/* Sapo */}
                  {detailArticle.summary && (
                    <p className="text-[14px] text-[--365-text-sub] leading-[1.65] italic font-medium m-0 pb-3 border-b border-[#f0f0f0]">
                      {stripHtml(detailArticle.summary)}
                    </p>
                  )}
                </div>

                {/* Cover Image */}
                {showCover && (
                  <div className="w-full overflow-hidden mt-3">
                    <img
                      src={getImg(detailArticle)}
                      alt={detailArticle.title}
                      onError={() => handleImgError(detailArticle.id)}
                      className="w-full h-auto block"
                    />
                  </div>
                )}

                {/* Article Content */}
                <div
                  className="article-content"
                  dangerouslySetInnerHTML={{
                    __html: contentHtml || "<p>Nội dung đang được cập nhật...</p>"
                  }}
                />

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 bg-[#f9fafb] border-t border-[#f0f0f0]">
                  <div className="flex items-center gap-1.5 text-[13px] text-[--365-text-sub] font-medium">
                    <span>Nguồn:</span>
                    <span className="font-semibold" style={{ color: getSourceColor(detailArticle.source) }}>
                      {detailArticle.source}
                    </span>
                  </div>
                  <Button
                    type="link"
                    size="small"
                    icon={<LinkOutlined />}
                    href={detailArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="!text-[13px] !text-[--color-primary] !p-0 !font-medium"
                  >
                    Xem bài gốc
                  </Button>
                </div>
              </Card>

              {/* Related — Mobile only */}
              <div className="mt-4 lg:hidden">
                <Card className="!rounded-xl" styles={{ body: { padding: '14px 16px' } }}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <FireOutlined className="text-[14px] text-[--color-primary]" />
                    <span className="text-[14px] font-semibold text-[--365-text-main]">Tin liên quan</span>
                  </div>
                  {relatedArticles.slice(0, 4).map(article => (
                    <RelatedItem
                      key={article.id}
                      article={article}
                      onClick={() => handleCardClick(article)}
                      imgErrors={imgErrors}
                      onImgError={handleImgError}
                    />
                  ))}
                </Card>
              </div>
            </div>

            {/* Sidebar — Desktop */}
            <aside className="hidden lg:block">
              <div className="sticky top-[80px] flex flex-col gap-3">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(`/news?page=${backPage}`)}
                  block
                  className="!text-[13px] !font-medium !text-[--365-text-sub] !border-[#e5e7eb] hover:!border-[--color-primary] hover:!text-[--color-primary] !rounded-lg !h-[36px] !shadow-sm"
                >
                  Quay lại danh sách
                </Button>

                <Card className="!rounded-xl" styles={{ body: { padding: '14px 16px' } }}>
                  <div className="flex items-center gap-2 mb-2.5 pb-2.5 border-b-2 border-[--color-primary]">
                    <FireOutlined className="text-[14px] text-[--color-primary]" />
                    <span className="text-[14px] font-semibold text-[--365-text-main]">Đọc thêm</span>
                  </div>
                  {relatedArticles.map(article => (
                    <RelatedItem
                      key={article.id}
                      article={article}
                      onClick={() => handleCardClick(article)}
                      imgErrors={imgErrors}
                      onImgError={handleImgError}
                    />
                  ))}
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEWS LISTING VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  const featuredArticle = articles[0];
  const listArticles = articles.slice(1);

  return (
    <ConfigProvider theme={newsTheme}>
      <div className="font-sans">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 mb-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-[36px] h-[36px] rounded-lg bg-gradient-to-br from-[#ea4c89] to-[#ff8c42] flex items-center justify-center text-white flex-shrink-0">
              <ReadOutlined className="text-[16px]" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[--365-text-main] m-0 leading-tight">Tin tức bóng đá</h2>
              <p className="text-[12px] text-[--365-text-sub] m-0 mt-0.5 font-medium">
                {totalDocs > 0 ? `Tổng cộng ${totalDocs} bài viết` : 'Đang cập nhật...'}
              </p>
            </div>
          </div>
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={() => loadNews(true)}
            disabled={loading}
            size="small"
            className="!text-[12px] !font-medium !rounded-full !border-[#e5e7eb] !text-[--365-text-sub] hover:!border-[--color-primary] hover:!text-[--color-primary]"
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>

        {/* Content */}
        {loading && articles.length === 0 ? (
          <NewsSkeletons />
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-xl py-16 shadow-sm">
            <Empty description="Chưa có tin tức mới" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3.5">
            {/* Main Column */}
            <div className="flex flex-col gap-0">
              {/* Featured */}
              {featuredArticle && (
                <FeaturedCard
                  article={featuredArticle}
                  onClick={() => handleCardClick(featuredArticle)}
                  imgErrors={imgErrors}
                  onImgError={handleImgError}
                />
              )}

              {/* List */}
              <Card
                className="!rounded-xl mt-3"
                styles={{ body: { padding: '4px 0' } }}
              >
                {listArticles.map((article, idx) => (
                  <div key={article.id}>
                    <NewsListItem
                      article={article}
                      onClick={() => handleCardClick(article)}
                      imgErrors={imgErrors}
                      onImgError={handleImgError}
                    />
                    {idx < listArticles.length - 1 && (
                      <Divider className="!my-0 !mx-3.5" />
                    )}
                  </div>
                ))}
              </Card>

              {/* Pagination */}
              {totalDocs > 12 && (
                <div className="flex justify-center mt-6 mb-4">
                  <Pagination 
                    current={currentPage} 
                    total={totalDocs} 
                    pageSize={12} 
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    className="custom-pagination"
                  />
                </div>
              )}
            </div>

            {/* Sidebar — Trending */}
            <aside className="hidden lg:block">
              <div className="sticky top-[80px]">
                <Card className="!rounded-xl" styles={{ body: { padding: '14px 16px' } }}>
                  <div className="flex items-center gap-2 mb-2.5 pb-2.5 border-b-2 border-[--color-primary]">
                    <FireOutlined className="text-[14px] text-[--color-primary]" />
                    <span className="text-[14px] font-semibold text-[--365-text-main]">Nổi bật</span>
                  </div>
                  {articles.slice(0, 8).map((article, idx) => (
                    <SidebarItem
                      key={article.id}
                      article={article}
                      rank={idx + 1}
                      onClick={() => handleCardClick(article)}
                      imgErrors={imgErrors}
                      onImgError={handleImgError}
                    />
                  ))}
                </Card>
              </div>
            </aside>
          </div>
        )}
      </div>
    </ConfigProvider>
  );
}
