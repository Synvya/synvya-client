import { updateSubscription } from './lib/subscription-db.js';

export const handler = async (event, context) => {
    console.log('Function started - event:', JSON.stringify(event, null, 2));

    const method = event.requestContext.http.method;
    console.log('Request method:', method);

    // Handle CORS preflight OPTIONS request
    if (method === 'OPTIONS') {
        console.log('Handling CORS preflight OPTIONS request');
        const response = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
        console.log('Returning OPTIONS response:', JSON.stringify(response));
        return response;
    }

    // Only allow POST requests for the actual function
    if (method !== 'POST') {
        console.log('Method not allowed:', method);
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

        console.log('Parsed request body:', JSON.stringify(body));
        console.log('Public key:', publicKey);
        console.log('Plan type:', planType);

        // Validate required fields
        if (!publicKey) {
            console.log('Missing public key');
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
            console.log('Invalid plan type:', planType);
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

        console.log('Environment check:');
        console.log('- API key present:', !!zapriteApiKey);
        console.log('- API key length:', zapriteApiKey?.length);
        console.log('- API key prefix:', zapriteApiKey?.substring(0, 8) + '...');

        if (!zapriteApiKey) {
            console.log('No Zaprite API key found in environment');
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

        // Create contact first
        console.log('Creating Zaprite contact...');
        const contactBody = {
            email: 'wedonotcollect@youremail.com',
            legalName: publicKey
        };
        console.log('Request body:', JSON.stringify(contactBody));

        const contactEndpoint = 'https://api.zaprite.com/v1/contact';
        console.log('API endpoint:', contactEndpoint);

        const contactResponse = await fetch(contactEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${zapriteApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactBody)
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
            monthly: { amount: 9.99, description: 'Monthly Subscription' },
            annual: { amount: 99, description: 'Annual Subscription' }
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
        const orderBody = {
            amount: plan.amount * 100, // Convert to cents
            currency: 'USD',
            sendReceiptToCustomer: false,
            allowSavePaymentProfile: true,
            contactId: contactResult.id,
            redirectUrl: `https://client.synvya.com/form`,
            label: planType === 'monthly' ? 'Monthly Subscription' : 'Annual Subscription',
            metadata: {
                'public-key': publicKey,
                'plan-type': planType,
                'valid-through': validThroughFormatted
            }
        };
        console.log('Order request body:', JSON.stringify(orderBody));
        console.log('Order API endpoint: https://api.zaprite.com/v1/order');

        const orderResponse = await fetch('https://api.zaprite.com/v1/order', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${zapriteApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderBody)
        });

        console.log('Order response status:', orderResponse.status);
        console.log('Order response headers:', Object.fromEntries(orderResponse.headers.entries()));

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
        console.log('Full order result:', JSON.stringify(orderResult, null, 2));

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
            body: JSON.stringify(orderResult)
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