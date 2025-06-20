/**
 * Shared Zaprite API Client
 * Used by both Netlify and Lambda functions to ensure consistent API interactions
 */

export class ZapriteClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.zaprite.com/v1';
    }

    /**
     * Search for contacts by public key
     * @param {string} publicKey - The public key to search for
     * @returns {Promise<Object|null>} Contact object or null if not found
     */
    async findContactByPublicKey(publicKey) {
        try {
            console.log('Searching for contact with public key:', publicKey);

            const response = await fetch(`${this.baseUrl}/contact?query=${encodeURIComponent(publicKey)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('Contact search failed:', response.status, response.statusText);
                return null;
            }

            const contacts = await response.json();
            console.log('Contact search response:', contacts);

            // Find contact where legalName matches the public key
            const matchingContact = contacts.find(contact => contact.legalName === publicKey);

            if (matchingContact) {
                console.log('Found existing contact:', matchingContact.id);
                return matchingContact;
            }

            console.log('No matching contact found');
            return null;
        } catch (error) {
            console.error('Error searching for contact:', error);
            throw new Error(`Failed to search for contact: ${error.message}`);
        }
    }

    /**
     * Create a new contact
     * @param {string} publicKey - The public key to use as legalName
     * @param {string} email - Email address (defaults to standard non-collection email)
     * @returns {Promise<Object>} Created contact object
     */
    async createContact(publicKey, email = 'wedonotcollect@youremail.com') {
        try {
            console.log('Creating new contact for public key:', publicKey);

            const contactData = {
                email,
                legalName: publicKey
            };

            const response = await fetch(`${this.baseUrl}/contact`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Contact creation failed:', response.status, response.statusText, errorText);
                throw new Error(`Contact creation failed: ${response.status} ${response.statusText}`);
            }

            const contact = await response.json();
            console.log('Contact created successfully:', contact.id);
            return contact;
        } catch (error) {
            console.error('Error creating contact:', error);
            throw new Error(`Failed to create contact: ${error.message}`);
        }
    }

    /**
     * Find or create a contact by public key
     * @param {string} publicKey - The public key
     * @returns {Promise<Object>} Contact object
     */
    async findOrCreateContact(publicKey) {
        try {
            // First try to find existing contact
            let contact = await this.findContactByPublicKey(publicKey);

            if (!contact) {
                // Create new contact if not found
                contact = await this.createContact(publicKey);
            }

            return contact;
        } catch (error) {
            console.error('Error in findOrCreateContact:', error);
            throw error;
        }
    }

    /**
     * Create a new order
     * @param {Object} orderData - Order creation data
     * @returns {Promise<Object>} Created order object
     */
    async createOrder(orderData) {
        try {
            console.log('Creating Zaprite order with data:', orderData);

            const response = await fetch(`${this.baseUrl}/order`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Order creation failed:', response.status, response.statusText, errorText);
                throw new Error(`Order creation failed: ${response.status} ${response.statusText}`);
            }

            const order = await response.json();
            console.log('Order created successfully:', order.id);
            return order;
        } catch (error) {
            console.error('Error creating order:', error);
            throw new Error(`Failed to create order: ${error.message}`);
        }
    }

    /**
     * Get order by ID
     * @param {string} orderId - The order ID
     * @returns {Promise<Object>} Order object
     */
    async getOrder(orderId) {
        try {
            console.log('Fetching order:', orderId);

            const response = await fetch(`${this.baseUrl}/order/${orderId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Order fetch failed:', response.status, response.statusText, errorText);
                throw new Error(`Order fetch failed: ${response.status} ${response.statusText}`);
            }

            const order = await response.json();
            console.log('Order fetched successfully:', orderId);
            return order;
        } catch (error) {
            console.error('Error fetching order:', error);
            throw new Error(`Failed to fetch order: ${error.message}`);
        }
    }
}

/**
 * Create a Zaprite client instance
 * @param {string} apiKey - Zaprite API key
 * @returns {ZapriteClient} Zaprite client instance
 */
export function createZapriteClient(apiKey) {
    if (!apiKey) {
        throw new Error('Zaprite API key is required');
    }
    return new ZapriteClient(apiKey);
} 