const axios = require("axios");

class Worker {
    constructor(id, commandCenter) {
        this.id = id;
        this.commandCenter = commandCenter;
        this.isRunning = false;
        this.username = "Njomzanr";
        this.password = "xQ.6FC+N,*AGTc.";
        this.claimCount = 0;
        this.totalXRP = 0;
        this.cookies = null;
        this.lastClaimTime = 0;
        this.retryCount = 0;
        this.maxRetries = 5;
    }

    async login(retryCount = 0) {
        if (retryCount >= this.maxRetries) {
            console.log(`💔 ${this.id}: Max login retries reached`);
            return false;
        }

        try {
            const formData = {
                email: this.username,
                password: this.password,
            };

            const response = await axios.post(
                "https://faucetearner.org/api.php?act=login",
                JSON.stringify(formData),
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json, text/javascript, */*; q=0.01",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                },
            );

            console.log(`💎 ${this.id} Server response:`, response.data);

            if (response.data.code === 0) {
                console.log(`🚀 ${this.id}: Login successful!`);
                this.cookies = response.headers["set-cookie"];
                return true;
            }

            throw new Error("Login failed");
        } catch (error) {
            console.log(`⚡ ${this.id}: Login retry ${retryCount + 1}...`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
            return this.login(retryCount + 1);
        }
    }

    async getDashboardStats() {
        try {
            const response = await axios.get(
                "https://faucetearner.org/dashboard.php",
                {
                    headers: {
                        Cookie: this.cookies,
                        Accept: "text/html,application/xhtml+xml",
                    },
                },
            );

            const totalBalanceMatch = response.data.match(
                /Total Balance:\s*([0-9.]+)\s*XRP/i,
            );
            const faucetEarningsMatch = response.data.match(
                /Faucet Earnings:\s*([0-9.]+)\s*XRP/i,
            );

            return {
                totalBalance: totalBalanceMatch
                    ? parseFloat(totalBalanceMatch[1])
                    : this.totalXRP,
                faucetEarnings: faucetEarningsMatch
                    ? parseFloat(faucetEarningsMatch[1])
                    : this.totalXRP,
            };
        } catch (error) {
            return {
                totalBalance: this.totalXRP,
                faucetEarnings: this.totalXRP,
            };
        }
    }

    async claim() {
        if (!this.isRunning) return;

        try {
            const now = Date.now();
            const timeSinceLastClaim = now - this.lastClaimTime;
            if (timeSinceLastClaim < 61000) {
                const waitTime = 61000 - timeSinceLastClaim;
                await new Promise((resolve) => setTimeout(resolve, waitTime));
            }

            const response = await axios.post(
                "https://faucetearner.org/api.php?act=faucet",
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json, text/javascript, */*; q=0.01",
                        "X-Requested-With": "XMLHttpRequest",
                        Cookie: this.cookies,
                    },
                },
            );

            if (response.data.code === 0) {
                const xrpMatch =
                    response.data.message.match(/(\d+\.\d+)\s*XRP/);
                if (xrpMatch) {
                    const amount = parseFloat(xrpMatch[1]);
                    this.claimCount++;
                    this.totalXRP += amount;
                    this.lastClaimTime = Date.now();
                    console.log(
                        `💰 ${this.id} CLAIMED #${this.claimCount}: ${amount} XRP | Total: ${this.totalXRP.toFixed(6)} XRP`,
                    );

                    if (this.claimCount % 1000 === 0) {
                        this.commandCenter.sendMilestoneAlert(this.id, {
                            claims: this.claimCount,
                            totalBalance: this.totalXRP,
                            sessionEarnings: this.totalXRP,
                        });
                    }
                }
            }
            this.retryCount = 0;
        } catch (error) {
            console.log(`💪 ${this.id}: Maintaining rhythm...`);
            this.retryCount++;
            if (this.retryCount >= this.maxRetries) {
                await this.relogin();
            }
        }
    }

    async relogin() {
        console.log(`🔄 ${this.id}: Refreshing session...`);
        this.retryCount = 0;
        if (await this.login()) {
            await this.navigateToFaucet();
        }
    }

    async startWorker() {
        console.log(`🚀 ${this.id} starting...`);
        this.isRunning = true;
        const loginSuccess = await this.login();

        if (loginSuccess) {
            const stats = await this.getDashboardStats();
            this.commandCenter.reportDuty(this.id, "STARTED", stats);
            await this.navigateToFaucet();
            return true;
        }

        this.commandCenter.reportDuty(this.id, "FAILED TO START", {
            totalBalance: 0,
        });
        return false;
    }

    async stopWorker() {
        console.log(`🛑 ${this.id} stopping...`);
        this.isRunning = false;
        const stats = await this.getDashboardStats();
        this.commandCenter.reportDuty(this.id, "STOPPED", stats);
    }

    async navigateToFaucet() {
        if (!this.isRunning) return;
        try {
            const response = await axios.get(
                "https://faucetearner.org/faucet.php",
                {
                    headers: {
                        Cookie: this.cookies,
                        Accept: "application/json, text/javascript, */*; q=0.01",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                },
            );
            console.log(`🎯 ${this.id}: Navigation successful!`);
            this.startClaiming();
        } catch (error) {
            console.log(`💪 ${this.id}: Navigation retry...`);
            setTimeout(() => this.navigateToFaucet(), 5000);
        }
    }

    async startClaiming() {
        console.log(`⚡ ${this.id}: Starting claim cycle...`);
        while (this.isRunning) {
            await this.claim();
            await new Promise((resolve) => setTimeout(resolve, 61000));
        }
    }
}

module.exports = Worker;
