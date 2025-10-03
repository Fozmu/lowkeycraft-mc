package net.lowkeycraft.stats;

import com.google.gson.JsonObject;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.Statistic;

import java.text.SimpleDateFormat;
import java.util.Date;

public class StatsApiService {

    private final LowkeycraftStatsPlugin plugin;
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public StatsApiService(LowkeycraftStatsPlugin plugin) {
        this.plugin = plugin;
    }

    public JsonObject getPlayerStats(String username) {
        JsonObject stats = new JsonObject();

        // Get player
        OfflinePlayer player = Bukkit.getOfflinePlayer(username);

        if (player == null || !player.hasPlayedBefore()) {
            throw new IllegalArgumentException("Player not found");
        }

        // Basic info
        stats.addProperty("username", player.getName());
        stats.addProperty("uuid", player.getUniqueId().toString());
        stats.addProperty("isOnline", player.isOnline());

        // Time statistics
        long firstPlayed = player.getFirstPlayed();
        long lastPlayed = player.getLastPlayed();

        if (firstPlayed > 0) {
            stats.addProperty("firstJoin", dateFormat.format(new Date(firstPlayed)));
        }

        if (lastPlayed > 0) {
            stats.addProperty("lastSeen", dateFormat.format(new Date(lastPlayed)));
        }

        // Get vanilla statistics using Bukkit API
        if (player.isOnline() || player.hasPlayedBefore()) {
            try {
                org.bukkit.entity.Player onlinePlayer = player.getPlayer();

                if (onlinePlayer != null) {
                    // Playtime in ticks (20 ticks = 1 second)
                    int playTimeTicks = onlinePlayer.getStatistic(Statistic.PLAY_ONE_MINUTE);
                    stats.addProperty("playtime", formatPlaytime(playTimeTicks));
                    stats.addProperty("playtimeTicks", playTimeTicks);

                    // Deaths
                    int deaths = onlinePlayer.getStatistic(Statistic.DEATHS);
                    stats.addProperty("deaths", deaths);

                    // Player kills
                    int playerKills = onlinePlayer.getStatistic(Statistic.PLAYER_KILLS);
                    stats.addProperty("playerKills", playerKills);

                    // Mob kills
                    int mobKills = onlinePlayer.getStatistic(Statistic.MOB_KILLS);
                    stats.addProperty("mobKills", mobKills);

                    // Distance traveled
                    int distanceWalked = onlinePlayer.getStatistic(Statistic.WALK_ONE_CM);
                    stats.addProperty("distanceWalked", distanceWalked / 100); // Convert to meters

                    // Jumps
                    int jumps = onlinePlayer.getStatistic(Statistic.JUMP);
                    stats.addProperty("jumps", jumps);

                    // Damage dealt
                    int damageDealt = onlinePlayer.getStatistic(Statistic.DAMAGE_DEALT);
                    stats.addProperty("damageDealt", damageDealt / 10); // Convert to hearts

                    // Damage taken
                    int damageTaken = onlinePlayer.getStatistic(Statistic.DAMAGE_TAKEN);
                    stats.addProperty("damageTaken", damageTaken / 10); // Convert to hearts

                    // Level
                    int level = onlinePlayer.getLevel();
                    stats.addProperty("level", level);

                    // Current world
                    stats.addProperty("world", onlinePlayer.getWorld().getName());
                } else {
                    // Player is offline, try to get cached stats
                    stats.addProperty("note", "Player is offline - some stats may be unavailable");
                }
            } catch (Exception e) {
                plugin.getLogger().warning("Failed to get statistics for " + username + ": " + e.getMessage());
            }
        }

        return stats;
    }

    public JsonObject getTopPlayers(String statistic) {
        JsonObject response = new JsonObject();
        response.addProperty("statistic", statistic);
        response.addProperty("note", "Top players feature coming soon - requires PlayerStats API integration");

        // TODO: Integrate with PlayerStats API to get top 10 players
        // This will require accessing PlayerStats.getAPI() and querying top statistics

        return response;
    }

    private String formatPlaytime(int ticks) {
        int seconds = ticks / 20;
        int minutes = seconds / 60;
        int hours = minutes / 60;
        int days = hours / 24;

        if (days > 0) {
            return String.format("%dd %dh %dm", days, hours % 24, minutes % 60);
        } else if (hours > 0) {
            return String.format("%dh %dm", hours, minutes % 60);
        } else if (minutes > 0) {
            return String.format("%dm %ds", minutes, seconds % 60);
        } else {
            return String.format("%ds", seconds);
        }
    }
}
