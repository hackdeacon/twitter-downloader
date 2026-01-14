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
 * Get Twitter video data using Twitter Syndication API with enhanced token
 */
async function getTwitterVideoData(tweetId) {
    try {
        // Generate a token (Twitter syndication API expects a token parameter)
        const token = generateToken();
        const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en&token=${token}`;

        const response = await fetch(syndicationUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://platform.twitter.com/',
                'Origin': 'https://platform.twitter.com'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tweet data');
        }

        const data = await response.json();

        if (!data || !data.mediaDetails || data.mediaDetails.length === 0) {
            throw new Error('No media found in tweet');
        }

        const media = data.mediaDetails.find(m => m.type === 'video' || m.type === 'animated_gif');

        if (!media || !media.video_info) {
            throw new Error('No video found in tweet');
        }

        // Extract video variants (different qualities)
        const variants = media.video_info.variants
            .filter(v => v.content_type === 'video/mp4')
            .map(v => ({
                url: v.url,
                bitrate: v.bitrate || 0,
                quality: determineQuality(v.bitrate)
            }))
            .sort((a, b) => b.bitrate - a.bitrate);

        return {
            title: data.text || 'Twitter Video',
            author: `@${data.user.screen_name}`,
            authorName: data.user.name,
            thumbnail: media.media_url_https,
            duration: formatDuration(media.video_info.duration_millis),
            qualities: variants
        };
    } catch (error) {
        console.error('Syndication API error:', error);
        // Fallback to alternative method
        return await getTwitterVideoDataFallback(tweetId);
    }
}

/**
 * Generate token for Twitter syndication API
 */
function generateToken() {
    // Simple token generation - Twitter's syndication API is forgiving
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 16; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

/**
 * Fallback method using multiple alternative APIs
 */
async function getTwitterVideoDataFallback(tweetId) {
    // Try multiple fallback services in order
    const fallbackAPIs = [
        {
            name: 'twitsave',
            url: `https://twitsave.com/info?url=https://twitter.com/i/status/${tweetId}`,
            parser: parseTwitsaveResponse
        },
        {
            name: 'direct-syndication',
            url: `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=&lang=en`,
            parser: parseSyndicationResponse
        }
    ];

    for (const api of fallbackAPIs) {
        try {
            const response = await fetch(api.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*'
                }
            });

            if (!response.ok) continue;

            const result = await api.parser(response, tweetId);
            if (result) return result;
        } catch (error) {
            console.error(`${api.name} fallback error:`, error);
            continue;
        }
    }

    throw new Error('Unable to fetch video from all sources. Please verify the tweet contains a video and is publicly accessible.');
}

/**
 * Parse twitsave response
 */
async function parseTwitsaveResponse(response, tweetId) {
    // Twitsave returns HTML, we need to extract JSON from it
    const html = await response.text();

    // Try to find video URLs in the HTML
    const videoUrlMatch = html.match(/https:\/\/video\.twimg\.com\/[^"']+\.mp4[^"']*/g);

    if (!videoUrlMatch || videoUrlMatch.length === 0) {
        return null;
    }

    // Get unique URLs and sort by quality indicators
    const uniqueUrls = [...new Set(videoUrlMatch)];
    const variants = uniqueUrls.map((url, index) => {
        // Try to determine quality from URL
        let bitrate = 0;
        let quality = 'SD';

        if (url.includes('/pu/vid/')) {
            const bitrateMatch = url.match(/\/(\d+)x(\d+)\//);
            if (bitrateMatch) {
                const width = parseInt(bitrateMatch[1]);
                bitrate = width >= 1280 ? 2000000 : width >= 640 ? 1000000 : 500000;
                quality = determineQuality(bitrate);
            }
        }

        return {
            url: url,
            bitrate: bitrate || (uniqueUrls.length - index) * 500000,
            quality: quality || (index === 0 ? 'HD' : 'SD')
        };
    }).sort((a, b) => b.bitrate - a.bitrate);

    return {
        title: 'Twitter Video',
        author: '@TwitterUser',
        authorName: 'Twitter User',
        thumbnail: '',
        duration: '0:00',
        qualities: variants
    };
}

/**
 * Parse syndication response
 */
async function parseSyndicationResponse(response, tweetId) {
    const data = await response.json();

    if (!data || !data.mediaDetails || data.mediaDetails.length === 0) {
        return null;
    }

    const media = data.mediaDetails.find(m => m.type === 'video' || m.type === 'animated_gif');

    if (!media || !media.video_info) {
        return null;
    }

    const variants = media.video_info.variants
        .filter(v => v.content_type === 'video/mp4')
        .map(v => ({
            url: v.url,
            bitrate: v.bitrate || 0,
            quality: determineQuality(v.bitrate)
        }))
        .sort((a, b) => b.bitrate - a.bitrate);

    return {
        title: data.text || 'Twitter Video',
        author: data.user ? `@${data.user.screen_name}` : '@TwitterUser',
        authorName: data.user ? data.user.name : 'Twitter User',
        thumbnail: media.media_url_https || '',
        duration: formatDuration(media.video_info.duration_millis),
        qualities: variants
    };
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
