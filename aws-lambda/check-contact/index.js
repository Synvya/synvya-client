export const handler = async (event, context) => {
    // Get HTTP method - Function URLs have different event structure
    const httpMethod = event.requestContext?.http?.method || event.httpMethod || 'GET';

    // Handle CORS preflight requests
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Max-Age': '86400' // Cache preflight for 24 hours
            },
            body: ''
        };
    }

    // Only allow POST requests
    if (httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { publicKey } = body;

        if (!publicKey) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST'
                },
                body: JSON.stringify({ error: 'Public key is required' })
            };
        }

        const zapriteApiKey = process.env.ZAPRITE_API_KEY;

        if (!zapriteApiKey) {
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST'
                },
                body: JSON.stringify({ error: 'Zaprite API key not configured' })
            };
        }

        console.log('Checking for existing contact with public key:', publicKey);

        // Search for contact by query (will search across multiple fields including legalName)
        // We filter results afterwards to only match contacts where legalName exactly equals the public key
        const contactSearchUrl = `https://api.zaprite.com/v1/contact?query=${encodeURIComponent(publicKey)}`;

        const response = await fetch(contactSearchUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${zapriteApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Zaprite API error:', response.status, errorText);
            throw new Error(`Zaprite API error: ${response.status}`);
        }

        const searchResult = await response.json();
        console.log('Contact search result:', searchResult);

        // Check if any contact has the public key as legalName
        const existingContact = searchResult.items.find(contact =>
            contact.legalName === publicKey
        );

        const contactExists = !!existingContact;
        console.log('Contact exists:', contactExists);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                exists: contactExists,
                contact: existingContact || null
            })
        };

    } catch (error) {
        console.error('Error checking contact:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({
                error: 'Failed to check contact',
                details: error.message
            })
        };
    }
}; 