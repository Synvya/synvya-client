export const handler = async (event, context) => {
    // Handle CORS preflight
    if (event.requestContext.http.method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    // Only allow POST requests
    if (event.requestContext.http.method !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { email } = body;

        if (!email) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Email is required' })
            };
        }

        const zapriteApiKey = process.env.ZAPRITE_API_KEY;

        if (!zapriteApiKey) {
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Zaprite API key not configured' })
            };
        }

        // Check if contact exists in Zaprite
        console.log('Checking contact in Zaprite for email:', email);
        const response = await fetch(`https://api.zaprite.com/v1/contacts?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${zapriteApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to check contact:', errorText);
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Failed to check contact' })
            };
        }

        const contactData = await response.json();
        const contactExists = contactData && contactData.length > 0;

        console.log('Contact check result:', contactExists);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                exists: contactExists,
                contact: contactExists ? contactData[0] : null
            })
        };

    } catch (error) {
        console.error('Error checking contact:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}; 