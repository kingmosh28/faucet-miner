import puppeteer from 'puppeteer';
import { Telegram } from 'telegraf';

// Configuration
const CONFIG = {
  LOGIN: {
    url: 'https://faucetearner.org/login',
    email: 'Njomzanr',
    password: 'xQ.6FC+N,*AGTc.'
  },
  TELEGRAM: {
    botToken: '7528489912:AAFRL4h9H3IsTjUrSg_lSbaard2gc8QGnnI',
    chatId: '6865449437'
  },
  SELECTORS: {
    emailInput: '#email',
    passwordInput: '#password',
    loginButton: '#login-button',
    claimButton: '#claimFaucet',
    balanceText: '.balance-amount'
  }
};

class FaucetEarnerBot {
  private telegram: Telegram;
  private totalClaims = 0;
  private lastBalance = 0;
  private startTime = Date.now();

  constructor() {
    this.telegram = new Telegram(CONFIG.TELEGRAM.botToken);
  }

  async start() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await this.login(page);
    await this.startClaimLoop(page);
  }

  private async login(page: any) {
    await page.goto(CONFIG.LOGIN.url);
    await page.type(CONFIG.SELECTORS.emailInput, CONFIG.LOGIN.email);
    await page.type(CONFIG.SELECTORS.passwordInput, CONFIG.LOGIN.password);
    await page.click(CONFIG.SELECTORS.loginButton);
    await page.waitForNavigation();
  }

  private async startClaimLoop(page: any) {
    while(true) {
      try {
        await this.performClaim(page);
        await this.checkMilestones(page);
        await page.waitForTimeout(60000); // 60 second wait
      } catch (error) {
        await this.handleError(page);
      }
    }
  }

  private async performClaim(page: any) {
    await page.click(CONFIG.SELECTORS.claimButton);
    this.totalClaims++;
  }

  private async checkMilestones(page: any) {
    const balance = await this.getBalance(page);

    // Every 100 claims milestone
    if(this.totalClaims % 100 === 0) {
      await this.sendUpdate(
        `🎯 CLAIM MILESTONE!\n` +
        `💰 Balance: ${balance} XRP\n` +
        `✨ Claims: ${this.totalClaims}\n` +
        `⏰ Running: ${this.getRunningTime()}`
      );
    }

    // Balance milestones (every 1 XRP)
    if(Math.floor(balance) > Math.floor(this.lastBalance)) {
      await this.sendUpdate(
        `🚀 XRP MILESTONE REACHED!\n` +
        `💎 New Balance: ${balance} XRP\n` +
        `🔥 Total Claims: ${this.totalClaims}\n` +
        `⚡ Hourly Rate: ${this.getHourlyRate()}`
      );
    }

    this.lastBalance = balance;
  }

  private async getBalance(page: any) {
    return await page.$eval(CONFIG.SELECTORS.balanceText, 
      (el: any) => parseFloat(el.textContent));
  }

  private async handleError(page: any) {
    await this.sendUpdate('⚠️ Error detected - Attempting recovery...');
    await page.reload();
  }

  private async sendUpdate(message: string) {
    await this.telegram.sendMessage(CONFIG.TELEGRAM.chatId, message);
  }

  private getRunningTime(): string {
    const hours = Math.floor((Date.now() - this.startTime) / 3600000);
    return `${hours} hours`;
  }

  private getHourlyRate(): number {
    return +(this.totalClaims / this.getRunningTime().split(' ')[0]).toFixed(2);
  }
}

// Start the money printer! 🚀
const bot = new FaucetEarnerBot();
bot.start();
