/**
 * Shared Order Service
 * Business logic for order creation, retrieval, and processing
 */

import { createZapriteClient } from '../api/zaprite-client.js';
import { calculateValidThroughDate } from '../utils/date-utils.js';
import { PLAN_DETAILS } from '../utils/constants.js';

/**
 * Create a new subscription order
 * @param {Object} params - Order creation parameters
 * @param {string} params.publicKey - User's public key
 * @param {string} params.planType - Plan type ('monthly' or 'annual')
 * @param {string} params.redirectUrl - URL to redirect after payment
 * @param {string} params.zapriteApiKey - Zaprite API key
 * @returns {Promise<Object>} Order creation result
 */
export async function createSubscriptionOrder({ publicKey, planType, redirectUrl, zapriteApiKey }) {
    try {
        console.log('Creating subscription order:', { publicKey, planType });

        // Validate plan type
        if (!PLAN_DETAILS[planType]) {
            throw new Error(`Invalid plan type: ${planType}`);
        }

        const client = createZapriteClient(zapriteApiKey);
        const plan = PLAN_DETAILS[planType];

        // Find or create contact
        const contact = await client.findOrCreateContact(publicKey);

        // Calculate valid-through date
        const validThroughDate = calculateValidThroughDate(planType);

        // Create order
        const orderData = {
            amount: plan.amount,
            currency: plan.currency,
            sendReceiptToCustomer: false,
            allowSavePaymentProfile: true,
            contactId: contact.id,
            redirectUrl,
            label: plan.label,
            metadata: {
                'public-key': publicKey,
                'plan-type': planType,
                'valid-through': validThroughDate
            }
        };

        const order = await client.createOrder(orderData);

        return {
            success: true,
            order,
            contact,
            validThroughDate
        };
    } catch (error) {
        console.error('Error creating subscription order:', error);
        throw error;
    }
}

/**
 * Get order details by ID
 * @param {Object} params - Parameters
 * @param {string} params.orderId - Order ID
 * @param {string} params.zapriteApiKey - Zaprite API key
 * @param {boolean} params.filterForTable - Whether to filter data for orders table display
 * @returns {Promise<Object>} Order details
 */
export async function getOrderDetails({ orderId, zapriteApiKey, filterForTable = false }) {
    try {
        console.log('Getting order details:', orderId);

        const client = createZapriteClient(zapriteApiKey);
        const order = await client.getOrder(orderId);

        if (filterForTable) {
            // Return filtered data for orders table display
            return {
                id: order.id,
                paidAt: order.paidAt,
                totalAmount: order.totalAmount,
                currency: order.currency,
                label: order.label,
                receiptPdfUrl: order.receiptPdfUrl,
                status: order.status,
                checkoutUrl: order.checkoutUrl,
                metadata: order.metadata
            };
        }

        return order;
    } catch (error) {
        console.error('Error getting order details:', error);
        throw error;
    }
}

/**
 * Get all orders for a user by public key
 * @param {Object} params - Parameters
 * @param {string} params.publicKey - User's public key
 * @param {Function} params.getSubscription - Function to get subscription data
 * @returns {Promise<Array>} List of order IDs
 */
export async function getUserOrderIds({ publicKey, getSubscription }) {
    try {
        console.log('Getting user orders for public key:', publicKey);

        const subscription = await getSubscription(publicKey);

        if (!subscription) {
            console.log('No subscription found for public key:', publicKey);
            return [];
        }

        // Return order IDs from subscription
        const orderIds = subscription.orderIds || [];
        console.log('Found order IDs:', orderIds);

        return orderIds;
    } catch (error) {
        console.error('Error getting user orders:', error);
        throw error;
    }
} 