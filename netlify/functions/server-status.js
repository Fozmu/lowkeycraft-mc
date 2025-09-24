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

        // Get status for both servers and total players ever
        const [mainServerData, eventsServerData, totalPlayersEver] = await Promise.all([
            getServerStatus(apiToken, mainServerId),
            getServerStatus(apiToken, eventsServerId),
            getTotalPlayersEver(apiToken, [mainServerId, eventsServerId])
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
                    totalPlayersEver: totalPlayersEver,
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

async function getTotalPlayersEver(apiToken, serverIds) {
    try {
        let totalPlayers = new Set();

        // Get player data from both servers
        for (const serverId of serverIds) {
            try {
                // Try to get player files from server world data
                const filesResponse = await axios.get(`https://api.exaroton.com/v1/servers/${serverId}/files/world/playerdata`, {
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Count .dat files (each represents a player)
                const files = filesResponse.data.data.children || [];
                const playerFiles = files.filter(file => file.name.endsWith('.dat'));

                playerFiles.forEach(file => {
                    // Extract UUID from filename (remove .dat extension)
                    const uuid = file.name.replace('.dat', '');
                    totalPlayers.add(uuid);
                });

            } catch (serverError) {
                console.log(`Could not access player files for server ${serverId}:`, serverError.response?.status);
                // If we can't access files, try alternative methods like whitelists
                try {
                    const listsResponse = await axios.get(`https://api.exaroton.com/v1/servers/${serverId}/playerlists`, {
                        headers: {
                            'Authorization': `Bearer ${apiToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    for (const list of listsResponse.data.data) {
                        try {
                            const listData = await axios.get(`https://api.exaroton.com/v1/servers/${serverId}/playerlists/${list.name}`, {
                                headers: {
                                    'Authorization': `Bearer ${apiToken}`,
                                    'Content-Type': 'application/json'
                                }
                            });

                            listData.data.data.entries.forEach(entry => {
                                if (entry.uuid) {
                                    totalPlayers.add(entry.uuid);
                                }
                            });
                        } catch (listError) {
                            continue;
                        }
                    }
                } catch (listError) {
                    continue;
                }
            }
        }

        return totalPlayers.size;
    } catch (error) {
        console.error('Error getting total players:', error);
        return null;
    }
}