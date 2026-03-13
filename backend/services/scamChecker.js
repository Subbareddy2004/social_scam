/**
 * Hybrid Scam Detection Service
 * 
 * Combines ML model (RoBERTa) + Gemini AI + pattern-based rules for maximum coverage:
 * - ML model catches: toxicity, threats, classic spam (text-only)
 * - Gemini AI catches: image scams, QR code fraud, fake screenshots, phishing visuals
 * - Pattern rules catch: phishing URLs, suspicious domains, scam keywords
 * The most suspicious result wins.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000/predict';
const ML_ANALYZE_URL = process.env.ML_ANALYZE_URL || 'http://127.0.0.1:8000/analyze';

// ─── Pattern-Based Detection ────────────────────────────────
function patternCheck(text) {
    const lowerText = (text || '').toLowerCase();

    // Phishing keywords (the ML model misses these)
    const phishingKeywords = [
        'verify your account', 'verify your identity', 'verify your details',
        'account has been suspended', 'account has been blocked', 'account has been hacked',
        'click here to reactivate', 'click here to verify', 'click here to update',
        'failure to verify', 'will result in suspension', 'permanent closure',
        'confirm your identity', 'update your details', 'reactivate your account',
        'unusual activity', 'unauthorized access', 'security alert',
    ];

    // Scam keywords
    const scamKeywords = [
        'click here to win', 'congratulations you won', 'send money',
        'lottery', 'free gift', 'act now', 'limited time offer',
        'suspended account', 'urgent action required',
        'wire transfer', 'nigerian prince', 'earn money fast',
        'claim your prize', 'you have been selected', 'free iphone',
        'win a', 'won a', 'get rich', 'make money online',
        'double your money', 'investment opportunity', 'guaranteed returns',
        'scan this', 'scan the qr', 'use this link', 'click the link',
        'bitcoin giveaway', 'crypto giveaway', 'send btc',
        'gift card', 'free money', 'quick cash',
        'processing fee', 'shipping fee', 'joining fee',
        'send your bank details', 'bank details',
        'relief fund', 'apply now at',
    ];

    // Check phishing keywords
    const matchedPhishing = phishingKeywords.filter(kw => lowerText.includes(kw));
    if (matchedPhishing.length > 0) {
        const confidence = Math.min(0.7 + matchedPhishing.length * 0.1, 0.98);
        return {
            is_scam: true,
            confidence,
            reason: `Phishing pattern detected: ${matchedPhishing.join(', ')}`,
            source: 'pattern',
        };
    }

    // Check scam keywords
    const matchedScam = scamKeywords.filter(kw => lowerText.includes(kw));
    if (matchedScam.length > 0) {
        const confidence = Math.min(0.5 + matchedScam.length * 0.15, 0.95);
        return {
            is_scam: true,
            confidence,
            reason: `Suspicious keywords detected: ${matchedScam.join(', ')}`,
            source: 'pattern',
        };
    }

    // Check for suspicious URL patterns
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
            confidence: 0.80,
            reason: `Suspicious URLs detected: ${suspiciousUrls.join(', ')}`,
            source: 'pattern',
        };
    }

    return { is_scam: false, confidence: 0, reason: 'No suspicious patterns', source: 'pattern' };
}

// ─── Combined ML + AI Detection (Text + Image) ─────────────
async function aiAnalyze(text, imageUrl) {
    try {
        const response = await fetch(ML_ANALYZE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text || '',
                image_url: imageUrl || null,
            }),
            signal: AbortSignal.timeout(60000), // 60s timeout for image analysis
        });

        if (response.ok) {
            const result = await response.json();
            return {
                is_scam: result.is_scam === true,
                confidence: typeof result.confidence === 'number' ? result.confidence : 0,
                reason: result.reason || 'AI analysis complete',
                label: result.label || (result.is_scam ? 'spam' : 'safe'),
                ml_result: result.ml_result || null,
                ai_result: result.ai_result || null,
                source: 'ai_combined',
            };
        }
        console.log('⚠️  AI analyze service returned status:', response.status);
    } catch (error) {
        console.log('⚠️  AI analyze service unavailable:', error.message);
    }
    return null;
}

// ─── ML Model Detection (text only, fallback) ──────────────
async function mlCheck(text) {
    try {
        const response = await fetch(ML_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
            signal: AbortSignal.timeout(30000),
        });

        if (response.ok) {
            const result = await response.json();
            return {
                is_scam: result.is_scam === true,
                confidence: typeof result.confidence === 'number' ? result.confidence : 0,
                reason: result.reason || 'ML analysis complete',
                source: 'ml',
            };
        }
        console.log('⚠️  ML service returned status:', response.status);
    } catch (error) {
        console.log('⚠️  ML service unavailable:', error.message);
    }
    return null; // ML unavailable
}

// ─── Hybrid Check (Main Export) ─────────────────────────────
/**
 * Check text + image for scam/spam content using:
 *   1. Combined AI analysis (RoBERTa ML + Gemini AI for text+image)
 *   2. Pattern-based rules
 * Returns the most suspicious result.
 */
export const checkForScam = async (text, imageUrl = null) => {
    console.log('🔍 Scam check starting...');
    console.log(`   Text: ${text?.substring(0, 80) || 'none'}...`);
    console.log(`   Image: ${imageUrl ? 'yes' : 'no'}`);

    // Try the combined AI analysis first (ML + Gemini) — handles text + image
    let aiCombinedResult = null;
    if (text || imageUrl) {
        aiCombinedResult = await aiAnalyze(text, imageUrl);
    }

    // Run pattern check on text
    const patternResult = patternCheck(text);

    console.log('🧠 AI Combined result:', aiCombinedResult ? JSON.stringify(aiCombinedResult) : 'unavailable');
    console.log('📋 Pattern result:', JSON.stringify(patternResult));

    // If AI combined analysis is available, use it as primary
    if (aiCombinedResult) {
        // If both AI and pattern detect scam, merge with higher confidence
        if (aiCombinedResult.is_scam && patternResult.is_scam) {
            const mergedConfidence = Math.max(aiCombinedResult.confidence, patternResult.confidence);
            console.log(`✅ Both AI & pattern flagged → confidence: ${mergedConfidence}`);
            return {
                is_scam: true,
                confidence: mergedConfidence,
                reason: `${aiCombinedResult.reason} | ${patternResult.reason}`,
                source: 'ai+pattern',
                ai_details: aiCombinedResult.ai_result,
            };
        }

        if (aiCombinedResult.is_scam) {
            console.log(`✅ AI flagged as scam (${aiCombinedResult.confidence})`);
            return {
                is_scam: true,
                confidence: aiCombinedResult.confidence,
                reason: aiCombinedResult.reason,
                source: aiCombinedResult.source,
                ai_details: aiCombinedResult.ai_result,
            };
        }

        if (patternResult.is_scam) {
            console.log(`✅ Pattern flagged as scam (${patternResult.confidence})`);
            return patternResult;
        }

        // Both say safe
        console.log('✅ AI + Pattern: content is safe');
        return {
            is_scam: false,
            confidence: aiCombinedResult.confidence,
            reason: `Content appears safe (AI + pattern check passed)`,
            source: 'ai+pattern',
            ai_details: aiCombinedResult.ai_result,
        };
    }

    // Fallback: AI unavailable — try old ML-only check
    console.log('⚡ AI analyze unavailable, falling back to ML-only...');
    const mlResult = await mlCheck(text);

    if (!mlResult) {
        console.log('⚡ ML also unavailable, using pattern result only');
        return patternResult;
    }

    // ML + Pattern combination (old behavior)
    if (mlResult.is_scam && patternResult.is_scam) {
        return {
            is_scam: true,
            confidence: Math.max(mlResult.confidence, patternResult.confidence),
            reason: `${mlResult.reason} | ${patternResult.reason}`,
        };
    }

    if (mlResult.is_scam) return mlResult;
    if (patternResult.is_scam) return patternResult;

    return {
        is_scam: false,
        confidence: mlResult.confidence,
        reason: 'Content appears safe (ML + pattern check passed)',
    };
};
