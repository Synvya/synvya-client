import { updateSubscription } from './lib/subscription-db.js';

export const handler = async (event, context) => {
    // Only allow POST requests
    if (event.requestContext.http.method !== 'POST') {
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
        const { publicKey, planType } = body;

        // Validate required fields
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

        if (!planType || !['monthly', 'annual'].includes(planType)) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST'
                },
                body: JSON.stringify({ error: 'Valid plan type is required (monthly or annual)' })
            };
        }

        const fixedEmail = 'wedonotcollect@youremail.com';
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

        console.log('API key present:', !!zapriteApiKey, 'Length:', zapriteApiKey?.length);
        console.log('API key prefix:', zapriteApiKey?.substring(0, 8) + '...');

        // Step 1: Create contact with fixed email
        console.log('Creating Zaprite contact...');
        const requestBody = {
            email: fixedEmail,
            name: `User ${publicKey.substring(0, 8)}`
        };
        console.log('Request body:', JSON.stringify(requestBody));
        console.log('API endpoint:', 'https://api.zaprite.com/v1/contacts');

        const contactResponse = await fetch('https://api.zaprite.com/v1/contacts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${zapriteApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', contactResponse.status);
        console.log('Response headers:', Object.fromEntries(contactResponse.headers.entries()));

        if (!contactResponse.ok) {
            const errorText = await contactResponse.text();
            console.error('Contact creation failed:', contactResponse.status, errorText);
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST'
                },
                body: JSON.stringify({
                    error: 'Failed to create contact',
                    details: errorText,
                    status: contactResponse.status
                })
            };
        }

        const contactResult = await contactResponse.json();
        console.log('Contact created successfully:', contactResult.id);

        // Step 2: Create order
        const planDetails = {
            monthly: { amount: 999, description: 'Monthly Subscription' },
            annual: { amount: 9999, description: 'Annual Subscription' }
        };

        const plan = planDetails[planType];
        const validThroughDate = new Date();
        if (planType === 'monthly') {
            validThroughDate.setMonth(validThroughDate.getMonth() + 1);
        } else {
            validThroughDate.setFullYear(validThroughDate.getFullYear() + 1);
        }
        const validThroughFormatted = validThroughDate.toISOString().split('T')[0];

        console.log('Creating Zaprite order...');
        const orderResponse = await fetch('https://api.zaprite.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${zapriteApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contactId: contactResult.id,
                amount: plan.amount,
                currency: 'USD',
                description: plan.description,
                sendReceiptToCustomer: false
            })
        });

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('Order creation failed:', errorText);
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST'
                },
                body: JSON.stringify({ error: 'Failed to create order' })
            };
        }

        const orderResult = await orderResponse.json();
        console.log('Order created successfully:', orderResult.id);

        // Step 3: Save subscription data to our database
        try {
            await updateSubscription(publicKey, {
                contactId: contactResult.id,
                validThrough: validThroughFormatted,
                planType: planType,
                orderId: orderResult.id,
                status: 'pending', // Will be updated via webhook when payment is confirmed
                orderIds: [] // Initialize empty array for order history
            });
            console.log('Subscription data saved successfully');
        } catch (dbError) {
            console.error('Failed to save subscription data:', dbError);
            // Don't fail the order creation, but log the error
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({
                orderId: orderResult.id,
                paymentUrl: orderResult.paymentUrl,
                contactId: contactResult.id,
                validThrough: validThroughFormatted
            })
        };

    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}; 