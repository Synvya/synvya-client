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
            "connect-src 'self' " +
            "wss://relay.damus.io wss://nos.lol wss://relay.primal.net wss://relay.nostr.band " +
            "https://si4pgos4rx3nykzya2y5ugcp6a0vwgdj.lambda-url.us-east-1.on.aws/ " +
            "https://r7sts256fb7qrwouximz3x2q6y0yroyx.lambda-url.us-east-1.on.aws/ " +
            "https://trfdrrplkdsjo3kynxuprpfnre0pxklc.lambda-url.us-east-1.on.aws/ " +
            "https://ynbxffgyxiqun476l2oa27qyma0neved.lambda-url.us-east-1.on.aws/ " +
            "https://w3ttcgeoojib2wi3ymbzafekfa0cdfmc.lambda-url.us-east-1.on.aws/ " +
            "https://tkrxeipv25uhrl7vea7h2rijgy0duzvo.lambda-url.us-east-1.on.aws/ " +
            "wss: https: blob:; " +
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