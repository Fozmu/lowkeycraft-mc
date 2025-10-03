package net.lowkeycraft.stats;

import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import spark.Spark;

public class StatsApiCommand implements CommandExecutor {

    private final LowkeycraftStatsPlugin plugin;
    private final StatsApiService apiService;

    public StatsApiCommand(LowkeycraftStatsPlugin plugin, StatsApiService apiService) {
        this.plugin = plugin;
        this.apiService = apiService;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!sender.hasPermission("lowkeycraftstats.admin")) {
            sender.sendMessage(ChatColor.RED + "You don't have permission to use this command.");
            return true;
        }

        if (args.length == 0) {
            sendUsage(sender);
            return true;
        }

        String subCommand = args[0].toLowerCase();

        switch (subCommand) {
            case "status":
                sendStatus(sender);
                break;

            case "info":
                sendInfo(sender);
                break;

            case "help":
                sendUsage(sender);
                break;

            default:
                sender.sendMessage(ChatColor.RED + "Unknown subcommand: " + subCommand);
                sendUsage(sender);
                break;
        }

        return true;
    }

    private void sendStatus(CommandSender sender) {
        sender.sendMessage(ChatColor.GREEN + "=== Lowkeycraft Stats API Status ===");
        sender.sendMessage(ChatColor.YELLOW + "API Server: " + ChatColor.WHITE + "Running on port 8080");
        sender.sendMessage(ChatColor.YELLOW + "PlayerStats: " + ChatColor.WHITE + "Enabled");
        sender.sendMessage(ChatColor.YELLOW + "Plugin Version: " + ChatColor.WHITE + plugin.getDescription().getVersion());
    }

    private void sendInfo(CommandSender sender) {
        sender.sendMessage(ChatColor.GREEN + "=== Lowkeycraft Stats API Info ===");
        sender.sendMessage(ChatColor.YELLOW + "Endpoints:");
        sender.sendMessage(ChatColor.WHITE + "  GET /health - Health check");
        sender.sendMessage(ChatColor.WHITE + "  GET /player/:username - Get player statistics");
        sender.sendMessage(ChatColor.WHITE + "  GET /server/stats - Get server statistics");
        sender.sendMessage(ChatColor.WHITE + "  GET /top/:statistic - Get top players (coming soon)");
        sender.sendMessage("");
        sender.sendMessage(ChatColor.YELLOW + "Example:");
        sender.sendMessage(ChatColor.WHITE + "  http://localhost:8080/player/Notch");
    }

    private void sendUsage(CommandSender sender) {
        sender.sendMessage(ChatColor.GREEN + "=== Lowkeycraft Stats API Commands ===");
        sender.sendMessage(ChatColor.YELLOW + "/statsapi status" + ChatColor.WHITE + " - Check API server status");
        sender.sendMessage(ChatColor.YELLOW + "/statsapi info" + ChatColor.WHITE + " - Show available endpoints");
        sender.sendMessage(ChatColor.YELLOW + "/statsapi help" + ChatColor.WHITE + " - Show this help message");
    }
}
