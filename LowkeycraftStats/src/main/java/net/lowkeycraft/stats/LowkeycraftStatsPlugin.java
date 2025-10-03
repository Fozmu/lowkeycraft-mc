wpackage net.lowkeycraft.stats;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.plugin.java.JavaPlugin;
import spark.Spark;

import java.util.logging.Level;

public class LowkeycraftStatsPlugin extends JavaPlugin {

    private static final int API_PORT = 8080;
    private final Gson gson = new Gson();
    private StatsApiService apiService;

    @Override
    public void onEnable() {
        getLogger().info("LowkeycraftStats plugin is starting...");

        // Check if PlayerStats is available
        if (!getServer().getPluginManager().isPluginEnabled("PlayerStats")) {
            getLogger().severe("PlayerStats plugin not found! Please install PlayerStats to use this plugin.");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        // Initialize API service
        apiService = new StatsApiService(this);

        // Start HTTP server
        startHttpServer();

        // Register commands
        getCommand("statsapi").setExecutor(new StatsApiCommand(this, apiService));

        getLogger().info("LowkeycraftStats plugin enabled successfully!");
        getLogger().info("API server running on port " + API_PORT);
    }

    @Override
    public void onDisable() {
        getLogger().info("LowkeycraftStats plugin is shutting down...");

        // Stop HTTP server
        Spark.stop();
        Spark.awaitStop();

        getLogger().info("LowkeycraftStats plugin disabled successfully!");
    }

    private void startHttpServer() {
        try {
            // Configure Spark
            Spark.port(API_PORT);
            Spark.threadPool(8, 2, 30000);

            // CORS headers for all routes
            Spark.before((request, response) -> {
                response.header("Access-Control-Allow-Origin", "*");
                response.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                response.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
                response.type("application/json");
            });

            // OPTIONS handler for CORS preflight
            Spark.options("/*", (request, response) -> {
                return "OK";
            });

            // Health check endpoint
            Spark.get("/health", (request, response) -> {
                JsonObject health = new JsonObject();
                health.addProperty("status", "ok");
                health.addProperty("server", "Lowkeycraft Stats API");
                health.addProperty("version", getDescription().getVersion());
                return gson.toJson(health);
            });

            // Player stats endpoint
            Spark.get("/player/:username", (request, response) -> {
                String username = request.params(":username");

                try {
                    JsonObject stats = apiService.getPlayerStats(username);
                    return gson.toJson(stats);
                } catch (Exception e) {
                    response.status(404);
                    JsonObject error = new JsonObject();
                    error.addProperty("error", "Player not found or stats unavailable");
                    error.addProperty("username", username);
                    return gson.toJson(error);
                }
            });

            // Server stats endpoint
            Spark.get("/server/stats", (request, response) -> {
                JsonObject serverStats = new JsonObject();
                serverStats.addProperty("onlinePlayers", Bukkit.getOnlinePlayers().size());
                serverStats.addProperty("maxPlayers", Bukkit.getMaxPlayers());
                serverStats.addProperty("serverName", Bukkit.getServerName());
                serverStats.addProperty("version", Bukkit.getVersion());
                return gson.toJson(serverStats);
            });

            // Top players endpoint (placeholder for future implementation)
            Spark.get("/top/:statistic", (request, response) -> {
                String statistic = request.params(":statistic");
                JsonObject top = apiService.getTopPlayers(statistic);
                return gson.toJson(top);
            });

            // Exception handling
            Spark.exception(Exception.class, (exception, request, response) -> {
                getLogger().log(Level.SEVERE, "API Error: " + exception.getMessage(), exception);
                response.status(500);
                response.body(gson.toJson(createError("Internal server error")));
            });

            // 404 handler
            Spark.notFound((request, response) -> {
                response.type("application/json");
                return gson.toJson(createError("Endpoint not found"));
            });

            Spark.awaitInitialization();
            getLogger().info("HTTP API server started on port " + API_PORT);

        } catch (Exception e) {
            getLogger().log(Level.SEVERE, "Failed to start HTTP server!", e);
        }
    }

    private JsonObject createError(String message) {
        JsonObject error = new JsonObject();
        error.addProperty("error", message);
        return error;
    }

    public StatsApiService getApiService() {
        return apiService;
    }
}
