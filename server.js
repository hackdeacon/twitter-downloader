const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/**
 * Extract tweet ID from Twitter URL
 */
function extractTweetId(url) {
    const patterns = [
        /twitter\.com\/\w+\/status\/(\d+)/i,
        /x\.com\/\w+\/status\/(\d+)/i
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

/**
 * Get Twitter video data using vxtwitter API (primary method)
 */
async function getTwitterVideoData(tweetId) {
    try {
        // Use vxtwitter API which is reliable and doesn't require authentication
        const vxUrl = `https://api.vxtwitter.com/status/${tweetId}`;

        const response = await fetch(vxUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tweet data');
        }

        const data = await response.json();

        if (!data || !data.hasMedia) {
            throw new Error('No media found in tweet');
        }

        // Check if there are video files in media_extended
        const videos = data.media_extended?.filter(m => m.type === 'video' || m.type === 'gif') || [];

        if (videos.length === 0) {
            throw new Error('No video found in tweet');
        }

        // Get the first video's variants
        const video = videos[0];
        const variants = [];

        // Add all available quality variants
        if (video.url) {
            // The main URL is usually the highest quality
            variants.push({
                url: video.url,
                bitrate: 5000000,
                quality: determineQuality(5000000)
            });
        }

        // Add thumbnail URL as a lower quality option if available
        if (video.thumbnail_url && video.thumbnail_url !== video.url) {
            variants.push({
                url: video.thumbnail_url,
                bitrate: 500000,
                quality: 'Low'
            });
        }

        // Calculate duration
        const duration = video.duration_millis ? formatDuration(video.duration_millis) : '0:00';

        return {
            title: data.text || 'Twitter Video',
            author: `@${data.user_screen_name}`,
            authorName: data.user_name,
            thumbnail: video.thumbnail_url || '',
            duration: duration,
            qualities: variants.length > 0 ? variants : [{ url: video.url, bitrate: 0, quality: 'HD' }]
        };
    } catch (error) {
        console.error('vxtwitter API error:', error);
        // Fallback to alternative method
        return await getTwitterVideoDataFallback(tweetId);
    }
}

/**
 * Fallback method using fxtwitter.com (third-party service)
 */
async function getTwitterVideoDataFallback(tweetId) {
    try {
        const url = `https://api.fxtwitter.com/status/${tweetId}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from fallback API');
        }

        const data = await response.json();

        if (!data.tweet || !data.tweet.media || !data.tweet.media.videos) {
            throw new Error('No video found');
        }

        const videos = data.tweet.media.videos;
        const variants = videos.map((v, index) => ({
            url: v.url,
            bitrate: (videos.length - index) * 1000000, // Approximate
            quality: index === 0 ? 'HD' : index === 1 ? 'SD' : 'Low'
        }));

        return {
            title: data.tweet.text || 'Twitter Video',
            author: `@${data.tweet.author.screen_name}`,
            authorName: data.tweet.author.name,
            thumbnail: data.tweet.media.photos?.[0]?.url || '',
            duration: '0:00',
            qualities: variants
        };
    } catch (error) {
        console.error('Fallback API error:', error);
        throw new Error('Unable to fetch video from all sources');
    }
}

/**
 * Determine quality label from bitrate
 */
function determineQuality(bitrate) {
    if (!bitrate) return 'Unknown';
    if (bitrate >= 2000000) return '1080p';
    if (bitrate >= 1000000) return '720p';
    if (bitrate >= 500000) return '480p';
    if (bitrate >= 250000) return '360p';
    return 'Low';
}

/**
 * Format duration from milliseconds
 */
function formatDuration(ms) {
    if (!ms) return '0:00';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * API endpoint to get video data
 */
app.post('/api/video', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const tweetId = extractTweetId(url);

        if (!tweetId) {
            return res.status(400).json({ error: 'Invalid Twitter URL' });
        }

        const videoData = await getTwitterVideoData(tweetId);

        res.json({
            success: true,
            data: videoData
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch video'
        });
    }
});

/**
 * Proxy endpoint to download/stream video (to avoid CORS issues)
 */
app.get('/api/download', async (req, res) => {
    try {
        const { url, preview } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        // Fetch the video
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://twitter.com/'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch video');
        }

        // Get content length if available
        const contentLength = response.headers.get('content-length');

        // Set headers
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');

        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }

        // If not preview mode, set download header
        if (preview !== 'true') {
            res.setHeader('Content-Disposition', `attachment; filename="twitter-video-${Date.now()}.mp4"`);
        }

        // Pipe the video stream to response
        response.body.pipe(res);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download video' });
    }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Root route - serve the main page
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Twitter Demo Server`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} in your browser\n`);
});
