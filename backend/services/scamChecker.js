/**
 * Scam Detection Service
 * 
 * Calls the Python ML service (BERT + pattern rules) for scam detection.
 * Falls back to a built-in keyword/URL check if the ML service is unavailable.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000/predict';

/**
 * Check text for scam content via ML service
 * @param {string} text - The post text content
 * @param {string|null} imageUrl - URL of the uploaded image (optional)
 * @returns {Object} { is_scam: boolean, confidence: number, reason: string }
 */
export const checkForScam = async (text, imageUrl = null) => {
    console.log('🔍 Scam check starting for text:', text?.substring(0, 80) + '...');
    console.log('🌐 ML Service URL:', ML_SERVICE_URL);

    try {
        const requestBody = JSON.stringify({ text, image_url: imageUrl });
        console.log('📤 Sending to ML service:', requestBody.substring(0, 200));

        // Call the ML service — allow 30 seconds for CPU-based BERT inference
        const response = await fetch(ML_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
            signal: AbortSignal.timeout(30000), // 30 second timeout for CPU inference
        });

        console.log('📥 ML service HTTP status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ ML service response:', JSON.stringify(result));
            return {
                is_scam: result.is_scam === true,
                confidence: typeof result.confidence === 'number' ? result.confidence : 1.0,
                reason: result.reason || 'ML analysis complete',
            };
        } else {
            const errorText = await response.text();
            console.log('⚠️  ML service returned status:', response.status, 'body:', errorText);
        }
    } catch (error) {
        console.error('⚠️  ML service ERROR:', error.code || error.name, error.message);
        console.error('    Full error:', error);
    }

    // ─── Fallback: keyword + URL pattern check ───
    console.log('🔄 Using fallback keyword/URL check');

    const lowerText = (text || '').toLowerCase();

    // Scam keywords
    const scamKeywords = [
        'click here to win', 'congratulations you won', 'send money',
        'lottery', 'free gift', 'act now', 'limited time offer',
        'verify your account', 'suspended account', 'urgent action required',
        'wire transfer', 'nigerian prince', 'earn money fast',
        'claim your prize', 'you have been selected', 'free iphone',
        'win a', 'won a', 'get rich', 'make money online',
        'double your money', 'investment opportunity', 'guaranteed returns',
        'scan this', 'scan the qr', 'use this link', 'click the link',
        'bitcoin giveaway', 'crypto giveaway', 'send btc',
        'gift card', 'free money', 'quick cash',
    ];

    const matchedKeywords = scamKeywords.filter(kw => lowerText.includes(kw));

    if (matchedKeywords.length > 0) {
        const confidence = Math.min(0.5 + matchedKeywords.length * 0.15, 0.95);
        return {
            is_scam: true,
            confidence,
            reason: `Suspicious keywords detected: ${matchedKeywords.join(', ')}`,
        };
    }

    // Check for suspicious URL patterns (including www. links)
    const urlPattern = /(?:https?:\/\/|www\.)\S+/gi;
    const urls = text?.match(urlPattern) || [];
    const suspiciousDomains = ['bit.ly', 'tinyurl', 'shorturl', 'free-money', 'win-prize', 'lotary', 'lottary'];
    const suspiciousTlds = ['.online', '.xyz', '.click', '.top', '.buzz', '.win', '.loan', '.gq', '.tk', '.cf'];

    const suspiciousUrls = urls.filter(url => {
        const lUrl = url.toLowerCase();
        return suspiciousDomains.some(d => lUrl.includes(d)) ||
            suspiciousTlds.some(tld => lUrl.includes(tld));
    });

    if (suspiciousUrls.length > 0) {
        return {
            is_scam: true,
            confidence: 0.75,
            reason: `Suspicious URLs detected: ${suspiciousUrls.join(', ')}`,
        };
    }

    return {
        is_scam: false,
        confidence: 1.0,
        reason: 'Content appears safe',
    };
};
