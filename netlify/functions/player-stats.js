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
        const { username, server } = JSON.parse(event.body);
        console.log(`Player stats request for: ${username} on server: ${server || 'main'}`);

        if (!username) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Username is required'
                })
            };
        }

        const playerStats = await getPlayerStats(username, server);

        if (!playerStats) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    playerFound: false,
                    message: 'Player not found'
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                playerFound: true,
                data: playerStats
            })
        };

    } catch (error) {
        console.error('Error fetching player stats:', error);
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

// Function to get player stats from Exaroton API
async function getPlayerStats(username, serverType = 'main') {
    const apiToken = process.env.EXAROTON_API_TOKEN;

    // Select server ID based on server type
    const serverId = serverType === 'events'
        ? process.env.EXAROTON_EVENTS_SERVER_ID
        : process.env.EXAROTON_MAIN_SERVER_ID;

    console.log('API Token:', apiToken ? 'Present' : 'Missing');
    console.log('Server Type:', serverType);
    console.log('Server ID:', serverId);

    if (!apiToken || apiToken === 'your_api_token_here') {
        console.log('Using mock data - Exaroton API token not configured');
        return getMockPlayerStats(username);
    }

    if (!serverId) {
        console.log('Server ID not found for type:', serverType);
        return null;
    }

    try {
        // Get server status to check if player is online
        const serverResponse = await axios.get(`https://api.exaroton.com/v1/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        const serverData = serverResponse.data.data;
        const isOnline = serverData.players && serverData.players.list ?
            serverData.players.list.some(player => player.name.toLowerCase() === username.toLowerCase()) : false;

        // Note: Exaroton API doesn't provide detailed player statistics
        // We can only get basic info like online status and player lists
        // For detailed stats, you'd need access to your server's database or use plugins

        if (serverData.players && serverData.players.list) {
            const playerFound = serverData.players.list.some(player =>
                player.name.toLowerCase() === username.toLowerCase()
            );

            if (playerFound || isOnline) {
                return {
                    username: username,
                    isOnline: isOnline,
                    playtime: 'N/A', // Not available via Exaroton API
                    firstJoin: 'N/A', // Not available via Exaroton API
                    lastSeen: isOnline ? 'Now' : 'N/A',
                    blocksBreaken: 'N/A', // Not available via Exaroton API
                    blocksPlaced: 'N/A', // Not available via Exaroton API
                    deaths: 'N/A' // Not available via Exaroton API
                };
            }
        }

        // Check player lists (whitelist, ops, etc.) to see if player exists
        try {
            const playerListsResponse = await axios.get(`https://api.exaroton.com/v1/servers/${serverId}/playerlists`, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const playerLists = playerListsResponse.data.data;
            let playerFound = false;

            // Check if player is in any list (whitelist, ops, etc.)
            for (const list of playerLists) {
                try {
                    const listResponse = await axios.get(`https://api.exaroton.com/v1/servers/${serverId}/playerlists/${list.name}`, {
                        headers: {
                            'Authorization': `Bearer ${apiToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    const listEntries = listResponse.data.data.entries;
                    if (listEntries.some(entry => entry.name && entry.name.toLowerCase() === username.toLowerCase())) {
                        playerFound = true;
                        break;
                    }
                } catch (listError) {
                    // Ignore errors for individual lists
                    continue;
                }
            }

            if (playerFound) {
                return {
                    username: username,
                    isOnline: false,
                    playtime: 'N/A',
                    firstJoin: 'N/A',
                    lastSeen: 'N/A',
                    blocksBreaken: 'N/A',
                    blocksPlaced: 'N/A',
                    deaths: 'N/A'
                };
            }
        } catch (listError) {
            console.error('Error checking player lists:', listError.response?.data || listError.message);
        }

        // If player not found via API but might exist, try mock data as fallback
        console.log(`Player ${username} not found in current online players or admin lists, checking mock data...`);
        return getMockPlayerStats(username);

    } catch (error) {
        console.error('Error fetching from Exaroton API:', error.response?.data || error.message);
        // Fallback to mock data on API error
        return getMockPlayerStats(username);
    }
}

// Mock function for testing when API token is not available or as fallback
function getMockPlayerStats(username) {
    const mockPlayers = ['Notch', 'jeb_', 'Dinnerbone', 'Grumm', 'Fozmu'];

    if (!mockPlayers.includes(username)) {
        return null; // Player not found
    }

    // Special stats for Fozmu
    if (username === 'Fozmu') {
        return {
            username: username,
            isOnline: true,
            playtime: '245h',
            firstJoin: '3 months ago',
            lastSeen: 'Now',
            blocksBreaken: 8750,
            blocksPlaced: 12340,
            deaths: 47
        };
    }

    return {
        username: username,
        isOnline: Math.random() > 0.5,
        playtime: `${Math.floor(Math.random() * 500)}h`,
        firstJoin: '2 months ago',
        lastSeen: '3 days ago',
        blocksBreaken: Math.floor(Math.random() * 10000),
        blocksPlaced: Math.floor(Math.random() * 15000),
        deaths: Math.floor(Math.random() * 100)
    };
}