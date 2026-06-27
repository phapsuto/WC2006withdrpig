/**
 * News Service
 * Query MongoDB cho bài viết, phục vụ frontend.
 */
const News = require('../models/News');

/**
 * Lấy danh sách bài viết, sắp xếp mới nhất trước, có phân trang.
 */
exports.getAllNews = async (page = 1, limit = 12) => {
  const skip = (page - 1) * limit;

  const [articles, totalDocs] = await Promise.all([
    News.find({})
      .sort({ pubDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    News.countDocuments({})
  ]);

  const docs = articles.map(article => ({
    id: article._id.toString(),
    title: article.title,
    titleVi: article.title, // Giữ tương thích frontend cũ
    slug: article.slug,
    content: article.content,
    contentVi: article.content, // Giữ tương thích frontend cũ
    summary: article.summary || '',
    drpigComment: article.drpigComment || '',
    source: article.source,
    url: article.url,
    author: article.author || '',
    image: article.localImage
      ? `http://localhost:${process.env.PORT || 5001}${article.localImage}`
      : article.image,
    pubDate: article.pubDate ? new Date(article.pubDate).getTime() : Date.now(),
    pubDateStr: article.pubDateStr || '',
    isLive: article.isLive || false,
    tags: article.tags || [],
  }));

  return {
    docs,
    totalDocs,
    limit,
    totalPages: Math.ceil(totalDocs / limit),
    currentPage: page
  };
};

/**
 * Lấy 1 bài viết theo slug. Hỗ trợ fallback tìm theo _id nếu slug chứa id ở cuối (backward compatibility)
 */
exports.getNewsBySlug = async (slug) => {
  let article = await News.findOne({ slug }).lean();
  
  // Fallback: If not found by exact slug, check if the slug ends with a 24-char ObjectId
  if (!article) {
    const match = slug.match(/-([a-f0-9]{24})$/i);
    if (match) {
      const id = match[1];
      article = await News.findById(id).lean();
    }
  }

  if (!article) throw new Error('Không tìm thấy bài viết');

  return {
    id: article._id.toString(),
    title: article.title,
    titleVi: article.title,
    slug: article.slug,
    content: article.content,
    contentVi: article.content,
    summary: article.summary || '',
    drpigComment: article.drpigComment || '',
    source: article.source,
    url: article.url,
    author: article.author || '',
    image: article.localImage
      ? `http://localhost:${process.env.PORT || 5001}${article.localImage}`
      : article.image,
    pubDate: article.pubDate ? new Date(article.pubDate).getTime() : Date.now(),
    pubDateStr: article.pubDateStr || '',
    isLive: article.isLive || false,
    tags: article.tags || [],
  };
};
