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
        console.log('Error: Exaroton API token not configured');
        return null;
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

        // Player not found in current online players or admin lists
        console.log(`Player ${username} not found in current online players or admin lists on ${serverType} server`);
        return null;

    } catch (error) {
        console.error('Error fetching from Exaroton API:', error.response?.data || error.message);
        return null;
    }
}

// Mock function for testing when API token is not available or as fallback
function getMockPlayerStats(username, serverType = 'main') {
    // Define players for each server separately
    const serverPlayers = {
        main: {
            players: ['Notch', 'jeb_', 'Dinnerbone', 'Steve', 'Alex'],
            data: {
                'Notch': { isOnline: false, playtime: '1250h', firstJoin: '6 months ago', lastSeen: '2 days ago', blocksBreaken: 45000, blocksPlaced: 67000, deaths: 23 },
                'jeb_': { isOnline: true, playtime: '890h', firstJoin: '4 months ago', lastSeen: 'Now', blocksBreaken: 32000, blocksPlaced: 48000, deaths: 15 },
                'Dinnerbone': { isOnline: false, playtime: '567h', firstJoin: '3 months ago', lastSeen: '1 week ago', blocksBreaken: 28000, blocksPlaced: 35000, deaths: 67 },
                'Steve': { isOnline: true, playtime: '234h', firstJoin: '2 months ago', lastSeen: 'Now', blocksBreaken: 12000, blocksPlaced: 18000, deaths: 34 },
                'Alex': { isOnline: false, playtime: '445h', firstJoin: '5 months ago', lastSeen: '3 days ago', blocksBreaken: 19000, blocksPlaced: 25000, deaths: 45 }
            }
        },
        events: {
            players: ['Fozmu', 'Grumm', 'EventMaster', 'BuilderPro', 'RedstoneKing'],
            data: {
                'Fozmu': { isOnline: true, playtime: '245h', firstJoin: '3 months ago', lastSeen: 'Now', blocksBreaken: 8750, blocksPlaced: 12340, deaths: 29 },
                'Grumm': { isOnline: false, playtime: '156h', firstJoin: '2 months ago', lastSeen: '5 hours ago', blocksBreaken: 6500, blocksPlaced: 9800, deaths: 29 },
                'EventMaster': { isOnline: true, playtime: '678h', firstJoin: '4 months ago', lastSeen: 'Now', blocksBreaken: 25000, blocksPlaced: 38000, deaths: 12 },
                'BuilderPro': { isOnline: false, playtime: '432h', firstJoin: '1 month ago', lastSeen: '1 day ago', blocksBreaken: 15000, blocksPlaced: 45000, deaths: 8 },
                'RedstoneKing': { isOnline: false, playtime: '321h', firstJoin: '2 months ago', lastSeen: '6 hours ago', blocksBreaken: 8900, blocksPlaced: 12000, deaths: 56 }
            }
        }
    };

    const serverData = serverPlayers[serverType];

    if (!serverData || !serverData.players.includes(username)) {
        return null; // Player not found on this server
    }

    const playerData = serverData.data[username];

    return {
        username: username,
        isOnline: playerData.isOnline,
        playtime: playerData.playtime,
        firstJoin: playerData.firstJoin,
        lastSeen: playerData.lastSeen,
        blocksBreaken: playerData.blocksBreaken,
        blocksPlaced: playerData.blocksPlaced,
        deaths: playerData.deaths
    };
}