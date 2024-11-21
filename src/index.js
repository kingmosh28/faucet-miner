const puppeteer = require('puppeteer');
const { Telegram } = require('telegraf');

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
  constructor() {
    this.telegram = new Telegram(CONFIG.TELEGRAM.botToken);
    this.totalClaims = 0;
    this.lastBalance = 0;
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

  async login(page) {
    await page.goto(CONFIG.LOGIN.url);
    await page.type(CONFIG.SELECTORS.emailInput, CONFIG.LOGIN.email);
    await page.type(CONFIG.SELECTORS.passwordInput, CONFIG.LOGIN.password);
    await page.click(CONFIG.SELECTORS.loginButton);
    await page.waitForNavigation();
    await this.sendUpdate('🚀 Bot Started! Ready to mine XRP!');
  }

  async startClaimLoop(page) {
    while(true) {
      try {
        await this.performClaim(page);
        await this.checkMilestones(page);
        await page.waitForTimeout(60000);
      } catch (error) {
        await this.handleError(page);
      }
    }
  }

  async performClaim(page) {
    await page.click(CONFIG.SELECTORS.claimButton);
    this.totalClaims++;
  }

  async checkMilestones(page) {
    const balance = await this.getBalance(page);

    if(this.totalClaims % 100 === 0) {
      await this.sendUpdate(
        `🎯 MILESTONE!\n💰 Balance: ${balance} XRP\n✨ Claims: ${this.totalClaims}`
      );
    }

    if(Math.floor(balance) > Math.floor(this.lastBalance)) {
      await this.sendUpdate(
        `🚀 NEW BALANCE!\n💎 Balance: ${balance} XRP\n🔥 Claims: ${this.totalClaims}`
      );
    }

    this.lastBalance = balance;
  }

  async getBalance(page) {
    return await page.$eval(CONFIG.SELECTORS.balanceText, el => Number(el.textContent));
  }

  async handleError(page) {
    await this.sendUpdate('⚠️ Error detected - Recovering...');
    await page.reload();
  }

  async sendUpdate(message) {
    await this.telegram.sendMessage(CONFIG.TELEGRAM.chatId, message);
  }
}

// Fire up the money printer! 🚀
const bot = new FaucetEarnerBot();
bot.start();
