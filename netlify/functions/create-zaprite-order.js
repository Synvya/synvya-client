export const handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { planType, publicKey, email } = JSON.parse(event.body);

        // Get API key from environment variables
        const apiKey = process.env.ZAPRITE_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Zaprite API key not configured' })
            };
        }

        // Define plan pricing
        const plans = {
            monthly: { price: 9.99, description: 'Full access to Synvya platform' },
            annual: { price: 99, description: 'Full access to Synvya platform (2 months free)' }
        };

        const plan = plans[planType];
        if (!plan) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid plan type' })
            };
        }

        if (!email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email is required' })
            };
        }

        // Get the origin from the request for redirect URL
        // For development, use the Vite dev server since Netlify dev server has rendering issues
        const origin = process.env.NODE_ENV === 'production'
            ? (event.headers.origin || event.headers.host)
            : 'http://localhost:3000';

        // Step 1: Search for existing contact first
        console.log('Searching for existing contact with public key:', publicKey);

        const searchResponse = await fetch(`https://api.zaprite.com/v1/contact?query=${encodeURIComponent(publicKey)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        });

        const searchResponseData = await searchResponse.text();

        if (!searchResponse.ok) {
            console.error('Zaprite Contact Search API error:', searchResponse.status, searchResponseData);
            return {
                statusCode: searchResponse.status,
                body: JSON.stringify({
                    error: `Zaprite Contact Search API error: ${searchResponse.status}`,
                    details: searchResponseData
                })
            };
        }

        const searchResult = JSON.parse(searchResponseData);
        console.log('Contact search result:', searchResult);

        let contactResult;

        // Check if contact already exists
        const existingContact = searchResult.items && searchResult.items.find(contact => contact.legalName === publicKey);

        if (existingContact) {
            console.log('Using existing contact:', existingContact);
            contactResult = existingContact;
        } else {
            // Step 1b: Create a new contact if not found
            const contactData = {
                legalName: publicKey,
                email: email
            };

            console.log('Creating new Zaprite contact:', contactData);

            const contactResponse = await fetch('https://api.zaprite.com/v1/contact', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactData)
            });

            const contactResponseData = await contactResponse.text();

            if (!contactResponse.ok) {
                console.error('Zaprite Contact API error:', contactResponse.status, contactResponseData);
                return {
                    statusCode: contactResponse.status,
                    body: JSON.stringify({
                        error: `Zaprite Contact API error: ${contactResponse.status}`,
                        details: contactResponseData
                    })
                };
            }

            contactResult = JSON.parse(contactResponseData);
            console.log('New contact created successfully:', contactResult);
        }

        // Step 2: Create order with contactId
        const orderData = {
            amount: plan.price * 100, // Convert to cents
            currency: 'USD',
            sendReceiptToCustomer: true,
            allowSavePaymentProfile: true,
            contactId: contactResult.id,
            redirectUrl: `${origin}/form`,
            label: planType === 'monthly' ? 'Monthly Subscription' : 'Annual Subscription',
            customerData: {
                email: email
            },
            metadata: {
                'public-key': publicKey,
                'plan-type': planType
            }
        };

        console.log('Creating Zaprite order:', orderData);

        // Call Zaprite API
        const response = await fetch('https://api.zaprite.com/v1/order', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        const responseData = await response.text();

        if (!response.ok) {
            console.error('Zaprite API error:', response.status, responseData);
            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error: `Zaprite API error: ${response.status}`,
                    details: responseData
                })
            };
        }

        const orderResult = JSON.parse(responseData);
        console.log('Order created successfully:', orderResult);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify(orderResult)
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message
            })
        };
    }
}; 