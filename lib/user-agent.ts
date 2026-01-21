// User-Agent Parser - Parse device, browser, OS from user agent string

interface ParsedUserAgent {
    device: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
    raw: string;
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
    const ua = userAgent || '';

    // Detect device type
    let device: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
        device = 'tablet';
    } else if (/Mobile|iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        device = 'mobile';
    }

    // Detect browser
    let browser = 'Unknown';
    if (/Edg\//i.test(ua)) {
        browser = 'Edge';
    } else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
        browser = 'Opera';
    } else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) {
        browser = 'Chrome';
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
        browser = 'Safari';
    } else if (/Firefox/i.test(ua)) {
        browser = 'Firefox';
    } else if (/MSIE|Trident/i.test(ua)) {
        browser = 'Internet Explorer';
    }

    // Extract browser version
    const browserVersionMatch = ua.match(/(Chrome|Firefox|Safari|Edge|OPR|Opera|MSIE)[\/\s]?(\d+)/i);
    if (browserVersionMatch) {
        browser = `${browser} ${browserVersionMatch[2]}`;
    }

    // Detect OS
    let os = 'Unknown';
    if (/Windows NT 10/i.test(ua)) {
        os = 'Windows 10/11';
    } else if (/Windows NT 6.3/i.test(ua)) {
        os = 'Windows 8.1';
    } else if (/Windows NT 6.2/i.test(ua)) {
        os = 'Windows 8';
    } else if (/Windows NT 6.1/i.test(ua)) {
        os = 'Windows 7';
    } else if (/Windows/i.test(ua)) {
        os = 'Windows';
    } else if (/Mac OS X/i.test(ua)) {
        const versionMatch = ua.match(/Mac OS X (\d+[._]\d+)/);
        os = versionMatch ? `macOS ${versionMatch[1].replace('_', '.')}` : 'macOS';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
        const versionMatch = ua.match(/OS (\d+[._]\d+)/);
        os = versionMatch ? `iOS ${versionMatch[1].replace('_', '.')}` : 'iOS';
    } else if (/Android/i.test(ua)) {
        const versionMatch = ua.match(/Android (\d+\.?\d*)/);
        os = versionMatch ? `Android ${versionMatch[1]}` : 'Android';
    } else if (/Linux/i.test(ua)) {
        os = 'Linux';
    } else if (/CrOS/i.test(ua)) {
        os = 'Chrome OS';
    }

    return {
        device,
        browser,
        os,
        raw: ua,
    };
}

// Get device icon emoji
export function getDeviceIcon(device: string): string {
    switch (device) {
        case 'mobile':
            return '📱';
        case 'tablet':
            return '📲';
        case 'desktop':
            return '🖥️';
        default:
            return '💻';
    }
}

// Get browser icon
export function getBrowserIcon(browser: string): string {
    const lowerBrowser = browser.toLowerCase();
    if (lowerBrowser.includes('chrome')) return '🌐';
    if (lowerBrowser.includes('safari')) return '🧭';
    if (lowerBrowser.includes('firefox')) return '🦊';
    if (lowerBrowser.includes('edge')) return '🔷';
    if (lowerBrowser.includes('opera')) return '🔴';
    return '🌍';
}

// Get OS icon
export function getOSIcon(os: string): string {
    const lowerOS = os.toLowerCase();
    if (lowerOS.includes('windows')) return '🪟';
    if (lowerOS.includes('mac') || lowerOS.includes('ios')) return '🍎';
    if (lowerOS.includes('android')) return '🤖';
    if (lowerOS.includes('linux')) return '🐧';
    return '💻';
}
