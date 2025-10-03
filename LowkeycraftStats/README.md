# LowkeycraftStats Plugin

A Minecraft Spigot/Paper plugin that provides a REST API for accessing player statistics. Integrates with PlayerStats plugin for enhanced statistics tracking.

## Features

- ✅ REST API server with CORS support
- ✅ Real-time player statistics
- ✅ Vanilla Minecraft statistics (deaths, kills, playtime, etc.)
- ✅ PlayerStats plugin integration (optional enhancement)
- ✅ JSON response format
- ✅ Easy web integration

## Requirements

- Minecraft Server: Spigot/Paper 1.20.4+
- Java: 17+
- Dependencies: PlayerStats plugin (optional but recommended)

## Installation

1. Download the latest `lowkeycraft-stats-1.0.0.jar` from releases
2. Place in your server's `plugins/` folder
3. Install PlayerStats plugin from: https://github.com/itHotL/PlayerStats
4. Restart your server
5. API server will start automatically on port 8080

## API Endpoints

### Health Check
```
GET http://localhost:8080/health
```
Returns server status and version info.

### Player Statistics
```
GET http://localhost:8080/player/:username
```
Returns detailed statistics for a specific player.

**Example Response:**
```json
{
  "username": "Notch",
  "uuid": "069a79f4-44e9-4726-a5be-fca90e38aaf5",
  "isOnline": true,
  "firstJoin": "2024-01-15 10:30:00",
  "lastSeen": "2024-01-20 15:45:00",
  "playtime": "5d 12h 30m",
  "playtimeTicks": 9450000,
  "deaths": 42,
  "playerKills": 15,
  "mobKills": 1523,
  "distanceWalked": 150000,
  "jumps": 5000,
  "damageDealt": 2500,
  "damageTaken": 1800,
  "level": 30,
  "world": "world"
}
```

### Server Statistics
```
GET http://localhost:8080/server/stats
```
Returns current server information.

### Top Players (Coming Soon)
```
GET http://localhost:8080/top/:statistic
```
Returns top 10 players for a specific statistic.

## In-Game Commands

- `/statsapi status` - Check API server status
- `/statsapi info` - Show available API endpoints
- `/statsapi help` - Show command help

**Permission:** `lowkeycraftstats.admin` (default: op)

## Building from Source

```bash
cd LowkeycraftStats
mvn clean package
```

The compiled JAR will be in `target/lowkeycraft-stats-1.0.0.jar`

## Integration with Website

Update your `stats.html` to use the new endpoints:

```javascript
async function getServerPlayerStats(username) {
    try {
        const response = await fetch(`http://mc.lowkeycraft.net:8080/player/${username}`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        return null;
    }
}
```

## Configuration

No configuration file needed! The plugin works out of the box on port 8080.

## Troubleshooting

**API not accessible from browser:**
- Check if port 8080 is open in your firewall
- Verify the server is running: `/statsapi status`
- Check server logs for errors

**Player stats not showing:**
- Ensure PlayerStats plugin is installed
- Player must have joined the server at least once
- Check player username spelling

## Support

For issues and support:
- GitHub: https://github.com/lowkeycraft
- Discord: https://lowkeycraft.net/discord

## License

Copyright © 2025 Lowkeycraft. All rights reserved.
