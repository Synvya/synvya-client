export const handler = async (event, context) => {
    // CORS is handled by Function URL configuration
    if (event.requestContext.http.method === 'OPTIONS') {
        return {
            statusCode: 200,
            body: ''
        };
    }

    // Only allow GET requests
    if (event.requestContext.http.method !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const orderId = event.queryStringParameters?.orderId;

        if (!orderId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Order ID is required' })
            };
        }

        const zapriteApiKey = process.env.ZAPRITE_API_KEY;

        if (!zapriteApiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Zaprite API key not configured' })
            };
        }

        // Fetch order from Zaprite API
        console.log('Fetching order from Zaprite:', orderId);
        const response = await fetch(`https://api.zaprite.com/v1/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${zapriteApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch order:', errorText);

            if (response.status === 404) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'Order not found' })
                };
            }

            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch order details' })
            };
        }

        const orderData = await response.json();
        console.log('Order fetched successfully:', orderId);

        // Return order data
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        };

    } catch (error) {
        console.error('Error fetching order:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}; 