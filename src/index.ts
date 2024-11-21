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
    try {
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
    } catch (error) {
      console.error('Startup error:', error);
      await this.sendUpdate('🔥 Critical error: Bot restarting...');
      process.exit(1);
    }
  }

  private async login(page: any): Promise<void> {
    await page.goto(CONFIG.LOGIN.url);
    await page.type(CONFIG.SELECTORS.emailInput, CONFIG.LOGIN.email);
    await page.type(CONFIG.SELECTORS.passwordInput, CONFIG.LOGIN.password);
    await page.click(CONFIG.SELECTORS.loginButton);
    await page.waitForNavigation();
    await this.sendUpdate('🚀 Bot Successfully Started!\n💰 Ready to mine XRP!');
  }

  private async startClaimLoop(page: any): Promise<void> {
    while(true) {
      try {
        await this.performClaim(page);
        await this.checkMilestones(page);
        await page.waitForTimeout(60000);
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
    const balanceText = await page.$eval(
      CONFIG.SELECTORS.balanceText, 
      (el: Element) => el.textContent || '0'
    );
    return Number(balanceText) || 0;
  }

  private async handleError(page: any, error: Error): Promise<void> {
    await this.sendUpdate(`⚠️ Error detected - Attempting recovery...\n${error.message}`);
    await page.reload();
    await page.waitForTimeout(5000);
  }

  private async sendUpdate(message: string): Promise<void> {
    try {
      await this.telegram.sendMessage(CONFIG.TELEGRAM.chatId, message);
    } catch (error) {
      console.error('Telegram notification error:', error);
    }
  }

  private getRunningTime(): number {
    return Math.floor((Date.now() - this.startTime) / 3600000);
  }

  private getHourlyRate(): number {
    const runningHours = this.getRunningTime();
    if (runningHours === 0) return 0;
    return Number((this.totalClaims / runningHours).toFixed(2));
  }
}

// Initialize and start the money printer! 🚀
const bot = new FaucetEarnerBot();
bot.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
