export const handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: ''
        };
    }

    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Get the order ID from query parameters
        const orderId = event.queryStringParameters?.orderId;

        if (!orderId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Order ID is required' })
            };
        }

        // Get Zaprite API key
        const apiKey = process.env.ZAPRITE_API_KEY;
        if (!apiKey) {
            console.error('ZAPRITE_API_KEY not found');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        console.log(`Fetching order details for: ${orderId}`);

        // Fetch order details from Zaprite
        const orderResponse = await fetch(`https://api.zaprite.com/v1/order/${orderId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        });

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('Failed to fetch order from Zaprite:', orderResponse.status, errorText);
            return {
                statusCode: orderResponse.status,
                body: JSON.stringify({
                    error: `Failed to fetch order: ${orderResponse.status}`,
                    details: errorText
                })
            };
        }

        const orderData = await orderResponse.json();
        console.log('Order data retrieved for:', orderId);

        // Extract relevant fields for the orders table
        const orderInfo = {
            id: orderData.id,
            paidAt: orderData.paidAt,
            totalAmount: orderData.totalAmount,
            currency: orderData.currency,
            label: orderData.label,
            receiptPdfUrl: orderData.receiptPdfUrl,
            status: orderData.status
        };

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: JSON.stringify(orderInfo)
        };

    } catch (error) {
        console.error('Get order error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message
            })
        };
    }
}; 