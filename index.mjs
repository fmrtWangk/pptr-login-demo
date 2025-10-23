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

page.goto(process.env.LOGIN_SUCCESS_URL);
const textSelector = await page
  .locator(process.env.LOGIN_SUCCESS_SELECTOR)
  .waitHandle();
textSelector.click();
