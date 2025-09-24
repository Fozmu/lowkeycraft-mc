const axios = require('axios');

exports.handler = async (event, context) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const apiToken = process.env.EXAROTON_API_TOKEN;
        const mainServerId = process.env.EXAROTON_MAIN_SERVER_ID;
        const eventsServerId = process.env.EXAROTON_EVENTS_SERVER_ID;

        if (!apiToken || !mainServerId || !eventsServerId) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Server configuration missing'
                })
            };
        }

        // Get status for both servers
        const [mainServerData, eventsServerData] = await Promise.all([
            getServerStatus(apiToken, mainServerId),
            getServerStatus(apiToken, eventsServerId)
        ]);

        const mainOnline = mainServerData?.players?.count || 0;
        const eventsOnline = eventsServerData?.players?.count || 0;
        const totalOnline = mainOnline + eventsOnline;

        const mainStatus = mainServerData?.status || 'offline';
        const eventsStatus = eventsServerData?.status || 'offline';

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: {
                    totalOnline: totalOnline,
                    mainServer: {
                        status: mainStatus,
                        online: mainOnline,
                        isRunning: mainStatus === 'online'
                    },
                    eventsServer: {
                        status: eventsStatus,
                        online: eventsOnline,
                        isRunning: eventsStatus === 'online'
                    }
                }
            })
        };

    } catch (error) {
        console.error('Error fetching server status:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Failed to fetch server status'
            })
        };
    }
};

async function getServerStatus(apiToken, serverId) {
    try {
        const response = await axios.get(`https://api.exaroton.com/v1/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.data;
    } catch (error) {
        console.error(`Error fetching server ${serverId}:`, error.response?.data || error.message);
        return null;
    }
}