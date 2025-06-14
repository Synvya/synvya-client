function handler(event) {
    var response = event.response;
    var headers = response.headers;

    // Security Headers for enhanced protection
    headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubdomains; preload' };
    headers['content-security-policy'] = {
        value: "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; " +
            "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
            "font-src 'self' fonts.gstatic.com; " +
            "img-src 'self' data: blob: https:; " +
            "connect-src 'self' wss: https: blob:; " +
            "frame-src 'self'; " +
            "object-src 'none'; " +
            "base-uri 'self';"
    };
    headers['x-content-type-options'] = { value: 'nosniff' };
    headers['x-frame-options'] = { value: 'DENY' };
    headers['x-xss-protection'] = { value: '1; mode=block' };
    headers['referrer-policy'] = { value: 'strict-origin-when-cross-origin' };
    headers['permissions-policy'] = {
        value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    };

    // Cache control for different file types
    var uri = event.request.uri;
    if (uri.endsWith('.html')) {
        headers['cache-control'] = { value: 'no-cache, no-store, must-revalidate' };
    } else if (uri.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        headers['cache-control'] = { value: 'public, max-age=31536000, immutable' };
    }

    return response;
} 