function handler(event) {
    var response = event.response;
    var headers = response.headers;

    // Content Security Policy with Lambda URLs included
    headers['content-security-policy'] = {
        value: [
            // 1️⃣  Same-origin for everything unless whitelisted below
            "default-src 'self'",

            // 2️⃣  WebSocket relays + Lambda Function URLs
            "connect-src 'self' " +
            "wss://relay.damus.io wss://nos.lol wss://relay.primal.net wss://relay.nostr.band " +
            "https://si4pgos4rx3nykzya2y5ugcp6a0vwgdj.lambda-url.us-east-1.on.aws/ " +
            "https://r7sts256fb7qrwouximz3x2q6y0yroyx.lambda-url.us-east-1.on.aws/ " +
            "https://trfdrrplkdsjo3kynxuprpfnre0pxklc.lambda-url.us-east-1.on.aws/ " +
            "https://ynbxffgyxiqun476l2oa27qyma0neved.lambda-url.us-east-1.on.aws/ " +
            "https://w3ttcgeoojib2wi3ymbzafekfa0cdfmc.lambda-url.us-east-1.on.aws/ " +
            "https://tkrxeipv25uhrl7vea7h2rijgy0duzvo.lambda-url.us-east-1.on.aws/",

            // 3️⃣  External images (nostr.build + blossom.band) and in-page <img src="data:...">
            "img-src 'self' https://i.nostr.build https://image.nostr.build https://blossom.band data: blob: https:",

            // 4️⃣  Google Fonts stylesheet + allow the framework's inline styles
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

            // 5️⃣  Font files fetched by that stylesheet
            "font-src 'self' https://fonts.gstatic.com",

            // 6️⃣  Scripts: self + third-party + inline + eval (for frameworks)
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co blob:",

            // 7️⃣  Harden the rest
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'none'",
            "frame-src 'self'"
        ].join("; ")
    };

    // Additional security headers just in case
    headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubdomains; preload' };
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