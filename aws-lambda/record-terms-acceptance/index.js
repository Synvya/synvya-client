/**
 * Record Terms Acceptance Lambda Function
 * Stores user signup records and terms acceptance for legal compliance
 */

const { validatePublicKey, validateRequiredFields } = require('../../shared/validation/request-validator.cjs');
const { formatSuccessResponse, formatErrorResponse, formatValidationErrorResponse } = require('../../shared/validation/response-formatter.cjs');
const { saveUserRecord } = require('../../shared/services/user-records-service.cjs');

const handler = async (event) => {
    console.log('Record terms acceptance function started - Lambda');

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

module.exports = { handler }; 