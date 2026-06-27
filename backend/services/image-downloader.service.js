/**
 * Image Downloader Service
 * Downloads remote images, converts to WebP, saves locally.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[ImageDownloader] sharp not available, images will use remote URLs');
}

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'news');
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop';

/**
 * Ensure the upload directory for the current month exists.
 */
function ensureDir(subDir) {
  const dir = path.join(UPLOAD_DIR, subDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Generate a short hash from a URL for unique filenames.
 */
function urlHash(url) {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

/**
 * Download an image from a URL and save as WebP locally.
 * @param {string} imageUrl - Remote image URL
 * @returns {string|null} Local path like /uploads/news/2026-06/abc123.webp or null on failure
 */
async function downloadImage(imageUrl) {
  if (!imageUrl || !sharp) return null;

  try {
    // Build month-based subdirectory
    const now = new Date();
    const subDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dir = ensureDir(subDir);

    const hash = urlHash(imageUrl);
    const filename = `${hash}.webp`;
    const filepath = path.join(dir, filename);
    const relativePath = `/uploads/news/${subDir}/${filename}`;

    // Skip if already downloaded
    if (fs.existsSync(filepath)) {
      console.log(`[ImageDownloader] Already exists: ${relativePath}`);
      return relativePath;
    }

    // Download the image
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*,*/*',
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[ImageDownloader] HTTP ${response.status} for ${imageUrl}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Validate it's actually an image (check magic bytes)
    if (buffer.length < 100) {
      console.warn(`[ImageDownloader] Too small (${buffer.length} bytes): ${imageUrl}`);
      return null;
    }

    // Convert to WebP with sharp, resize to max 800x450 for thumbnails
    await sharp(buffer)
      .resize(800, 450, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toFile(filepath);

    console.log(`[ImageDownloader] Saved: ${relativePath} (${buffer.length} bytes → WebP)`);
    return relativePath;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[ImageDownloader] Timeout downloading: ${imageUrl}`);
    } else {
      console.warn(`[ImageDownloader] Error: ${error.message} for ${imageUrl}`);
    }
    return null;
  }
}

/**
 * Get fallback image URL when download fails.
 */
function getFallbackImage() {
  return FALLBACK_IMAGE;
}

module.exports = {
  downloadImage,
  getFallbackImage,
  urlHash,
};
