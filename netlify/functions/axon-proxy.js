const axios = require('axios');

exports.handler = async (event, context) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { username, endpoint } = JSON.parse(event.body);
        console.log(`Axon proxy request for: ${username} to endpoint: ${endpoint}`);

        if (!username || !endpoint) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Username and endpoint are required'
                })
            };
        }

        // Make request to your Axon server
        const response = await axios.get(endpoint, {
            timeout: 10000, // 10 second timeout
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Lowkeycraft-Website/1.0'
            }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: response.data
            })
        };

    } catch (error) {
        console.error('Error proxying to Axon server:', error.response?.data || error.message);

        // Handle different types of errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Axon server is not reachable'
                })
            };
        }

        if (error.response && error.response.status === 404) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Player not found on server'
                })
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Internal server error'
            })
        };
    }
};