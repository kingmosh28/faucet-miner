const http = require('http');
const axios = require('axios');
const CommandCenter = require("./command.js");

class XRPFactory {
    constructor() {
        console.log("🚀 Initializing XRP Factory...");
        this.setupErrorHandlers();
        this.commandCenter = new CommandCenter();
    }

    setupErrorHandlers() {
        process.on("uncaughtException", (error) => {
            console.log("💪 Maintaining operation despite error:", error.message);
        });

        process.on("unhandledRejection", (error) => {
            console.log("💪 Handling rejected promise:", error.message);
        });

        process.on("SIGINT", async () => {
            console.log("💎 Graceful shutdown initiated...");
            if (this.commandCenter) {
                await this.commandCenter.shutdown();
            }
            process.exit(0);
        });
    }

    async initialize() {
        console.log("⚡ Command Center Online!");
        console.log("🎯 Ready for Telegram commands...");
        
        const server = http.createServer((req, res) => {
            res.writeHead(200);
            res.end('OK');
        });
        
        server.listen(8000, () => {
            console.log('🏥 Health check server running on port 8000');
        });
    }
}

// Start the XRP Factory
console.log("💎 XRP Factory Bootup Sequence...");
const factory = new XRPFactory();
factory.initialize().catch((error) => {
    console.log("⚠️ Initialization error:", error.message);
    process.exit(1);
});
