/**
 * Record Terms Acceptance Function
 * Stores user signup records and terms acceptance for legal compliance
 */

import { validatePublicKey, validateRequiredFields } from '../../shared/validation/request-validator.js';
import { formatSuccessResponse, formatErrorResponse, formatValidationErrorResponse } from '../../shared/validation/response-formatter.js';
import { saveUserRecord } from '../../shared/services/user-records-service.js';

export const handler = async (event, context) => {
    console.log('Record terms acceptance function started - Netlify');

    try {
        // Only allow POST requests
        if (event.httpMethod !== 'POST') {
            return formatErrorResponse('Method not allowed', 405);
        }

        // Parse request body
        let body;
        try {
            body = JSON.parse(event.body || '{}');
            console.log('Parsed request body:', body);
        } catch (error) {
            return formatErrorResponse('Invalid JSON in request body', 400);
        }

        // Validate required fields
        const requiredFields = ['publicKey', 'termsVersion'];
        const validation = validateRequiredFields(body, requiredFields);
        if (!validation.isValid) {
            return formatValidationErrorResponse(
                'Missing required fields',
                { missing: validation.missing }
            );
        }

        // Validate public key format
        if (!validatePublicKey(body.publicKey)) {
            return formatValidationErrorResponse('Invalid public key format');
        }

        console.log('Recording terms acceptance for user:', body.publicKey.slice(0, 8) + '...');

        // Prepare user record data - ONLY store essential fields
        const recordData = {
            publicKey: body.publicKey,
            acceptedAt: new Date().toISOString(),
            termsVersion: body.termsVersion
        };

        // Save user record
        await saveUserRecord(body.publicKey, recordData);

        console.log('Terms acceptance recorded for user:', body.publicKey.slice(0, 8) + '...');
        console.log('Terms acceptance recorded successfully');

        return formatSuccessResponse({
            message: 'Terms acceptance recorded successfully',
            acceptedAt: recordData.acceptedAt,
            termsVersion: recordData.termsVersion
        });

    } catch (error) {
        console.error('Error recording terms acceptance:', error);
        return formatErrorResponse('Internal server error', 500);
    }
}; 