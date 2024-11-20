import puppeteer from 'puppeteer';
import { Telegram } from 'telegraf';

interface Config {
  LOGIN: {
    url: string;
    email: string;
    password: string;
  };
  TELEGRAM: {
    botToken: string;
    chatId: string;
  };
  SELECTORS: {
    emailInput: string;
    passwordInput: string;
    loginButton: string;
    claimButton: string;
    balanceText: string;
  };
}

const CONFIG: Config = {
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
  private totalClaims: number = 0;
  private lastBalance: number = 0;
  private startTime: number = Date.now();

  constructor() {
    this.telegram = new Telegram(CONFIG.TELEGRAM.botToken);
  }

  async start(): Promise<void> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    await this.login(page);
    await this.startClaimLoop(page);
  }

  private async login(page: any): Promise<void> {
    await page.goto(CONFIG.LOGIN.url);
    await page.type(CONFIG.SELECTORS.emailInput, CONFIG.LOGIN.email);
    await page.type(CONFIG.SELECTORS.passwordInput, CONFIG.LOGIN.password);
    await page.click(CONFIG.SELECTORS.loginButton);
    await page.waitForNavigation();
  }

  private async startClaimLoop(page: any): Promise<void> {
    while(true) {
      try {
        await this.performClaim(page);
        await this.checkMilestones(page);
        await page.waitForTimeout(60000); // 60 second wait
      } catch (error) {
        await this.handleError(page, error);
      }
    }
  }

  private async performClaim(page: any): Promise<void> {
    await page.click(CONFIG.SELECTORS.claimButton);
    this.totalClaims++;
  }

  private async checkMilestones(page: any): Promise<void> {
    const balance = await this.getBalance(page);

    if(this.totalClaims % 100 === 0) {
      await this.sendUpdate(
        `🎯 CLAIM MILESTONE!\n` +
        `💰 Balance: ${balance} XRP\n` +
        `✨ Claims: ${this.totalClaims}\n` +
        `⏰ Running: ${this.getRunningTime()} hours`
      );
    }

    if(Math.floor(balance) > Math.floor(this.lastBalance)) {
      await this.sendUpdate(
        `🚀 XRP MILESTONE REACHED!\n` +
        `💎 New Balance: ${balance} XRP\n` +
        `🔥 Total Claims: ${this.totalClaims}\n` +
        `⚡ Hourly Rate: ${this.getHourlyRate()} claims/hr`
      );
    }

    this.lastBalance = balance;
  }

  private async getBalance(page: any): Promise<number> {
    const balanceText = await page.$eval(CONFIG.SELECTORS.balanceText, 
      (el: any) => el.textContent);
    return parseFloat(balanceText);
  }

  private async handleError(page: any, error: any): Promise<void> {
    await this.sendUpdate(`⚠️ Error detected - Attempting recovery...\n${error.message}`);
    await page.reload();
  }

  private async sendUpdate(message: string): Promise<void> {
    await this.telegram.sendMessage(CONFIG.TELEGRAM.chatId, message);
  }

  private getRunningTime(): number {
    return Math.floor((Date.now() - this.startTime) / 3600000);
  }

  private getHourlyRate(): number {
    const runningHours = this.getRunningTime();
    return runningHours > 0 ? +(this.totalClaims / runningHours).toFixed(2) : 0;
  }
}

// Fire up the money printer! 🚀
const bot = new FaucetEarnerBot();
bot.start().catch(console.error);
