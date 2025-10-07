import { test, expect, chromium } from '@playwright/test';
import { MailfenceHelper } from './helpers/mailfenceHelper';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
console.log('✅ ENV loaded:', process.env.MAILFENCE_USER, process.env.MAILFENCE_PASS);

const helper = new MailfenceHelper();

test.describe('Mailfence e2e - send/receive/save attachment', () => {
  test('send email to self, save attachment to Documents, move to trash', async () => {
    const user = process.env.MAILFENCE_USER;
    const pass = process.env.MAILFENCE_PASS;
    if (!user || !pass) throw new Error('Set MAILFENCE_USER and MAILFENCE_PASS in .env');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    // 1. Open site and login
    await page.goto('https://account.proton.me/mail');
    await helper.login(page, user, pass);

    // 2. Send email to self with attachment
    const subject = `E2E test ${Date.now()}`;
    const filePath = path.resolve(__dirname, 'test-data', 'testfile.txt');
    await helper.composeAndSendEmail(page, subject, 'Hello from Playwright', filePath);

    // 3. Wait for the email to arrive in Inbox
    await helper.waitForEmailInInbox(page, subject);

    // 4. Open the email
    await helper.openEmailBySubject(page, subject);

    // 5. Save attachment to Documents
    await helper.saveAttachmentToDocuments(page);

    // 6. Move email to Trash
    await helper.moveEmailToTrash(page);

    // 7. Check email is in Trash
    await helper.verifyEmailInTrash(page, subject);

    await browser.close();
  });
});
