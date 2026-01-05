// ========================================
// DOM Elements
// ========================================
const urlInput = document.getElementById('twitterUrl');
const downloadBtn = document.getElementById('downloadBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const videoPreview = document.getElementById('videoPreview');
const previewVideo = document.getElementById('previewVideo');
const videoTitle = document.getElementById('videoTitle');
const videoAuthor = document.getElementById('videoAuthor');
const videoDuration = document.getElementById('videoDuration');
const qualityButtons = document.getElementById('qualityButtons');

// ========================================
// State Management
// ========================================
let currentVideoData = null;

// ========================================
// Event Listeners
// ========================================
downloadBtn.addEventListener('click', handleDownload);
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleDownload();
    }
});

urlInput.addEventListener('input', () => {
    hideError();
});

// ========================================
// Main Functions
// ========================================

/**
 * Handle download button click
 */
async function handleDownload() {
    const url = urlInput.value.trim();

    // Validate URL
    if (!url) {
        showError('Please enter a Twitter video URL');
        return;
    }

    if (!isValidTwitterUrl(url)) {
        showError('Please enter a valid Twitter video URL');
        return;
    }

    // Show loading state
    showLoading();
    hideError();
    hideVideoPreview();

    try {
        // Fetch video data
        const videoData = await fetchVideoData(url);

        if (!videoData) {
            throw new Error('Unable to fetch video information');
        }

        // Store current video data
        currentVideoData = videoData;

        // Display video preview
        displayVideoPreview(videoData);

        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to fetch video, please check the URL');
        console.error('Error:', error);
    }
}

/**
 * Validate Twitter URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isValidTwitterUrl(url) {
    const twitterPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
    return twitterPattern.test(url);
}

/**
 * Fetch video data from our backend API
 * @param {string} url - Twitter video URL
 * @returns {Promise<Object>} Video data
 */
async function fetchVideoData(url) {
    try {
        // Use our own backend API
        const apiUrl = '/api/video';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch video');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            throw new Error('Invalid response from server');
        }

        const data = result.data;

        // Format the response for our frontend
        return {
            title: data.title || 'Twitter Video',
            author: data.author || '@TwitterUser',
            authorName: data.authorName || '',
            duration: data.duration || '0:00',
            thumbnail: data.thumbnail || '',
            qualities: data.qualities.map(q => ({
                quality: q.quality,
                size: formatFileSize(q.bitrate),
                url: q.url,
                bitrate: q.bitrate
            }))
        };
    } catch (error) {
        console.error('Backend API error:', error);
        throw new Error(error.message || 'Unable to fetch video information');
    }
}

/**
 * Format bitrate to file size estimate
 */
function formatFileSize(bitrate) {
    if (!bitrate) return 'Unknown';
    // Rough estimate: bitrate * 10 seconds / 8 bits per byte
    const bytes = (bitrate * 10) / 8;
    if (bytes >= 1000000) {
        return `~${(bytes / 1000000).toFixed(1)} MB/10s`;
    }
    return `~${(bytes / 1000).toFixed(0)} KB/10s`;
}

/**
 * Determine video quality from URL
 * @param {string} url - Video URL
 * @returns {string} Quality label
 */
function determineQuality(url) {
    if (url.includes('_full')) return '1080p';
    if (url.includes('_hd')) return '720p';
    if (url.includes('_sd')) return '480p';
    if (url.includes('_low')) return '360p';
    return 'HD';
}

/**
 * Display video preview
 * @param {Object} videoData - Video data object
 */
function displayVideoPreview(videoData) {
    // Set video source through proxy (use highest quality for preview)
    const videoUrl = videoData.qualities[0].url;
    const proxyUrl = `/api/download?url=${encodeURIComponent(videoUrl)}`;
    previewVideo.src = proxyUrl;

    // Set video metadata
    videoTitle.textContent = videoData.title;
    videoAuthor.textContent = videoData.author;

    // Generate quality buttons
    qualityButtons.innerHTML = '';
    videoData.qualities.forEach((quality, index) => {
        const button = createQualityButton(quality);
        // Add staggered animation delay
        button.style.animation = `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both`;
        qualityButtons.appendChild(button);
    });

    // Show preview section with smooth animation
    videoPreview.classList.remove('hidden');
    videoPreview.style.opacity = '0';
    videoPreview.style.transform = 'translateY(20px)';

    requestAnimationFrame(() => {
        videoPreview.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        videoPreview.style.opacity = '1';
        videoPreview.style.transform = 'translateY(0)';
    });

    // Scroll to preview smoothly
    setTimeout(() => {
        videoPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 200);
}

/**
 * Create quality button
 * @param {Object} quality - Quality data
 * @returns {HTMLButtonElement}
 */
function createQualityButton(quality) {
    const button = document.createElement('button');
    button.className = 'quality-btn';
    button.textContent = quality.quality;

    button.addEventListener('click', () => {
        downloadVideo(quality.url, quality.quality);
    });

    return button;
}

/**
 * Download video through backend proxy
 * @param {string} url - Video URL
 * @param {string} quality - Video quality
 */
async function downloadVideo(url, quality) {
    try {
        // Show download starting toast
        showSuccessToast(`Preparing ${quality} download...`);

        // Use our backend proxy to download the video
        const proxyUrl = `/api/download?url=${encodeURIComponent(url)}`;

        // Create a temporary anchor element
        const a = document.createElement('a');
        a.href = proxyUrl;
        a.download = `twitter-video-${quality}-${Date.now()}.mp4`;
        a.target = '_blank';

        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Show success feedback after a short delay
        setTimeout(() => {
            showSuccessToast(`${quality} download started`);
        }, 500);

    } catch (error) {
        console.error('Download error:', error);
        showError('Download failed, please try again');
    }
}

/**
 * Show success toast
 * @param {string} message - Success message
 */
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--success);
        color: white;
        padding: 1rem 1.75rem;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0, 186, 124, 0.3);
        font-weight: 600;
        font-size: 0.9375rem;
        z-index: 1000;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 2500);
}

// ========================================
// UI Helper Functions
// ========================================

/**
 * Show loading spinner
 */
function showLoading() {
    loadingSpinner.classList.remove('hidden');
    loadingSpinner.style.opacity = '0';
    loadingSpinner.style.transform = 'scale(0.9)';
    requestAnimationFrame(() => {
        loadingSpinner.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        loadingSpinner.style.opacity = '1';
        loadingSpinner.style.transform = 'scale(1)';
    });
    downloadBtn.disabled = true;
    downloadBtn.style.opacity = '0.6';
    downloadBtn.style.cursor = 'not-allowed';
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    loadingSpinner.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    loadingSpinner.style.opacity = '0';
    loadingSpinner.style.transform = 'scale(0.9)';
    setTimeout(() => {
        loadingSpinner.classList.add('hidden');
        loadingSpinner.style.transform = '';
        loadingSpinner.style.opacity = '';
        loadingSpinner.style.transition = '';
    }, 300);
    downloadBtn.disabled = false;
    downloadBtn.style.opacity = '1';
    downloadBtn.style.cursor = 'pointer';
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

/**
 * Hide error message
 */
function hideError() {
    errorMessage.classList.add('hidden');
}

/**
 * Hide video preview
 */
function hideVideoPreview() {
    videoPreview.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    videoPreview.style.opacity = '0';
    videoPreview.style.transform = 'translateY(20px)';
    setTimeout(() => {
        videoPreview.classList.add('hidden');
        videoPreview.style.opacity = '';
        videoPreview.style.transform = '';
        videoPreview.style.transition = '';
    }, 400);
}

// ========================================
// Theme Management
// ========================================

/**
 * Initialize theme based on system preference
 */
function initializeTheme() {
    // Get system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');

    // Listen for system theme changes and update in real-time
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        setTheme(e.matches ? 'dark' : 'light');
    });
}

/**
 * Set theme
 * @param {string} theme - 'light' or 'dark'
 */
function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

// ========================================
// Additional Animations
// ========================================

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ========================================
// Initialize
// ========================================

/**
 * Enable animations after initial page load
 * This prevents the initial render from triggering transitions
 */
function enableAnimations() {
    document.body.classList.remove('no-animations');
    document.body.classList.add('animations-enabled');

    // 手动触发动画，避免初始渲染时的抖动
    const logo = document.querySelector('.logo');
    const inputSection = document.querySelector('.input-section');

    if (logo) {
        logo.style.animation = 'slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    if (inputSection) {
        inputSection.style.animation = 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }
}

// Initialize theme
initializeTheme();

// Enable animations after DOM is ready (next frame to ensure CSS is applied)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        requestAnimationFrame(enableAnimations);
    });
} else {
    requestAnimationFrame(enableAnimations);
}

console.log('Twitter Demo initialized');
