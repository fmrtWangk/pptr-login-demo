// const puppeteer = require('puppeteer');
// const fs = require('fs');
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

class LoginManager {
  constructor(browser, options = {}) {
    this.browser = browser;
    this.options = options;
    this.cookiesFile = options.cookiesFile || './cookies.json';
  }

  async login(credentials) {
    const page = await this.browser.newPage();

    await page.goto(credentials.loginUrl);

    // 等待并填写表单
    await page.waitForSelector(credentials.usernameSelector);
    await page.type(credentials.usernameSelector, credentials.username);
    await page.type(credentials.passwordSelector, credentials.password);

    // 提交表单
    await page.click(credentials.submitSelector);

    // 等待登录完成
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // 验证登录成功
    if (credentials.successSelector) {
      await page.waitForSelector(credentials.successSelector, { timeout: 30000 });
    }

    await page.click(credentials.successSelector);
    await page.click('::-p-text(【开启)');
    fs.writeFileSync('./url.txt', page.url());
    await page.click('::-p-text(进入)');
    // 保存会话
    await this.saveCookies(page);
    console.log('登录成功！');
    return page;
  }

  async tryResumeSession() {
    const page = await this.browser.newPage();

    if (!fs.existsSync(this.cookiesFile)) {
      return null;
    }

    const cookies = JSON.parse(fs.readFileSync(this.cookiesFile));

    for (const cookie of cookies) {
      await page.setCookie(cookie);
    }

    // 验证会话是否仍然有效
    console.log('会话恢复成功');
    return page;
  }

  async saveCookies(page) {
    const cookies = await page.cookies();
    fs.writeFileSync(this.cookiesFile, JSON.stringify(cookies, null, 2));
  }
}

const browser = await puppeteer.launch({
  // headless: false,
  args: [
    '--no-sandbox',
    '--disable-features=HttpsFirstBalancedModeAutoEnable',
    '--disable-web-security',
    // '--disable-setuid-sandbox',
    // '--disable-dev-shm-usage',
    // '--disable-accelerated-2d-canvas',
    // '--no-first-run',
    // '--no-zygote',
    // '--disable-gpu',
    // '--disable-features=VizDisplayCompositor',
    // '--disable-background-timer-throttling',
    // '--disable-backgrounding-occluded-windows',
    // '--disable-renderer-backgrounding',
  ],
});

// 使用示例
const loginManager = new LoginManager(browser, {
  cookiesFile: './cookies.json'
});

// 尝试恢复会话
let page = await loginManager.tryResumeSession();

if (!page) {
  // 需要重新登录
  page = await loginManager.login({
    loginUrl: process.env.LOGIN_URL,
    username: process.env.LOGIN_USERNAME,
    password: process.env.LOGIN_PASSWORD,
    usernameSelector: process.env.LOGIN_USERNAME_SELECTOR,
    passwordSelector: process.env.LOGIN_PASSWORD_SELECTOR,
    submitSelector: process.env.LOGIN_SUBMIT_SELECTOR,
    successSelector: process.env.LOGIN_SUCCESS_SELECTOR,
  });
}
const url = fs.readFileSync('./url.txt', 'utf8');
await page.goto(url);

async function clickText(text, page) {
  const link = await page
    .$(`::-p-text(${text})`);
  console.log(link);
  if (link) {
    await link.click();
    await page.waitForNavigation();
  }
}
// await new Promise(resolve => setTimeout(resolve, 300));
await clickText('进入', page);
// await new Promise(resolve => setTimeout(resolve, 300));
await clickText('返回游戏', page);
// await new Promise(resolve => setTimeout(resolve, 300));
await clickText('三界', page);
// await new Promise(resolve => setTimeout(resolve, 300));
await clickText('进入仙界', page);
// await new Promise(resolve => setTimeout(resolve, 300));
await clickText('领工资', page);
console.log(await page.content());
