const axios = require('axios');
const Worker = require('./worker.js');

class CommandCenter {
    constructor() {
        this.token = '7528489912:AAFRL4h9H3IsTjUrSg_lSbaard2gc8QGnnI';
        this.chatId = '6865449437';
        this.apiUrl = `https://api.telegram.org/bot${this.token}`;
        this.workers = new Map();
        this.lastUpdateId = 0;
        this.isRunning = true;
        this.startPolling();
    }

    async sendMessage(text) {
        try {
            const url = `${this.apiUrl}/sendMessage`;
            const payload = {
                chat_id: this.chatId,
                text: text,
                parse_mode: 'HTML'
            };
            await axios.post(url, payload);
        } catch (error) {
            console.log('📡 Message retry...');
            setTimeout(() => this.sendMessage(text), 5000);
        }
    }

    async getUpdates() {
        try {
            const url = `${this.apiUrl}/getUpdates`;
            const params = {
                offset: this.lastUpdateId + 1,
                timeout: 30
            };
            const response = await axios.get(url, { params });
            return response.data.result;
        } catch (error) {
            console.log('📡 Update retry...');
            return [];
        }
    }

    async startPolling() {
        console.log('🚀 Command Center Online! Waiting for commands...');
        while (this.isRunning) {
            try {
                const updates = await this.getUpdates();
                if (updates.length > 0) {
                    this.lastUpdateId = updates[updates.length - 1].update_id;
                    await this.handleUpdates(updates);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.log('💪 Maintaining command rhythm...');
            }
        }
    }

    async handleUpdates(updates) {
        for (const update of updates) {
            if (!update.message?.text) continue;
            if (update.message.chat.id.toString() !== this.chatId) continue;

            const command = update.message.text;
            await this.processCommand(command);
        }
    }

    async processCommand(command) {
        switch (command) {
            case '/start':
                await this.startNewWorker();
                break;
            case '/stop':
                await this.stopAllWorkers();
                break;
            case '/progress':
                await this.reportProgress();
                break;
        }
    }

    async startNewWorker() {
        const workerId = `WORKER-${Date.now()}`;
        console.log(`🚀 Starting ${workerId}...`);
        
        const worker = new Worker(workerId, this);
        this.workers.set(workerId, worker);
        
        const success = await worker.startWorker();
        if (success) {
            const stats = await worker.getDashboardStats();
            await this.sendMessage(
                `💪 ${workerId} deployed!\n` +
                `📊 Initial balance: ${stats.totalBalance} XRP`
            );
        }
    }

    async stopAllWorkers() {
        const activeWorkers = this.workers.size;
        if (activeWorkers === 0) {
            await this.sendMessage('⚠️ No active workers to stop!');
            return;
        }

        for (const [id, worker] of this.workers) {
            await worker.stopWorker();
            const stats = await worker.getDashboardStats();
            await this.sendMessage(
                `🛑 ${id} STOPPED!\n` +
                `📊 Final Claims: ${worker.claimCount}\n` +
                `💰 Total Balance: ${stats.totalBalance} XRP\n` +
                `⚡ Session Earnings: ${worker.totalXRP} XRP`
            );
        }

        await this.sendMessage(`🔥 Stopped ${activeWorkers} workers!`);
        this.workers.clear();
    }

    async reportProgress() {
        if (this.workers.size === 0) {
            await this.sendMessage('⚠️ No active workers!');
            return;
        }

        for (const [id, worker] of this.workers) {
            const stats = await worker.getDashboardStats();
            await this.sendMessage(
                `📊 ${id} STATUS:\n` +
                `🎯 Claims: ${worker.claimCount}\n` +
                `💰 Total Balance: ${stats.totalBalance} XRP\n` +
                `⚡ Session Earnings: ${worker.totalXRP} XRP\n` +
                `🎯 Next milestone: ${Math.ceil(worker.claimCount/1000)*1000} claims`
            );
        }
    }

    async sendMilestoneAlert(workerId, stats) {
        await this.sendMessage(
            `🎯 MILESTONE ALERT!\n` +
            `Worker: ${workerId}\n` +
            `Claims: ${stats.claims}\n` +
            `💰 Total Balance: ${stats.totalBalance} XRP\n` +
            `⚡ Session Earnings: ${stats.sessionEarnings} XRP`
        );
    }

    async reportDuty(workerId, status, stats) {
        await this.sendMessage(
            `📢 ${workerId} ${status}\n` +
            `💰 Total Balance: ${stats.totalBalance} XRP`
        );
    }

    async shutdown() {
        this.isRunning = false;
        await this.stopAllWorkers();
        await this.sendMessage('💎 System shutdown complete!');
    }
}

module.exports = CommandCenter;
