import { Page, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export class MailfenceHelper {
  // -------------------
  // User login
  // -------------------
  async login(page: Page, username: string, password: string) {
    await page.fill('#username', username);
    await page.fill('#password', password);
    await page.click('button:has-text("Sign in")');
    await page.waitForSelector('text=Inbox', { timeout: 60000 });
    console.log('User successfully logged in and is in Inbox');
  }

  // -------------------------------------------------
  // Compose and send email with attachment
  // -------------------------------------------------
  async composeAndSendEmail(page: Page, subject: string, body: string, attachmentPath: string) {
    await page.click('[data-testid="sidebar:compose"]');
    await page.waitForSelector('.composer-container', { timeout: 10000 });
    console.log('Opened new email form');

    const toEmail = process.env.MAILFENCE_USER!;
    await page.fill('input[data-testid="composer:to"]', toEmail);
    await page.fill('input[data-testid="composer:subject"]', subject);
    console.log(`Filled in fields To: ${toEmail} and Subject: ${subject}`);

    const iframeLocator = page.frameLocator('iframe[data-testid="rooster-iframe"]');
    const bodyInIframe = iframeLocator.locator('body[contenteditable="true"]');
    if (await bodyInIframe.count() > 0) {
      await bodyInIframe.evaluate((el, value) => { el.innerHTML = value; }, body);
    } else {
      const bodyEditable = page.locator('div[contenteditable="true"]');
      if (await bodyEditable.count() > 0) {
        await bodyEditable.first().evaluate((el, value) => { el.innerHTML = value; }, body);
      } else {
        await page.fill('textarea[name="body"]', body).catch(() => {});
      }
    }
    console.log('Email body filled in');

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      const absolutePath = path.isAbsolute(attachmentPath)
        ? attachmentPath
        : path.resolve(__dirname, '../test-data', attachmentPath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found at path: ${absolutePath}`);
      }
      await fileInput.setInputFiles(absolutePath);
      console.log(`Attachment added: ${absolutePath}`);
    } else {
      throw new Error('Element for uploading a file (input[type="file"]) not found.');
    }

    await page.click('button[data-testid="composer:send-button"]');
    await page.waitForSelector('text=Message sent', { timeout: 20000 }).catch(() => {});
    console.log(`Email with subject "${subject}" sent`);
  }

  // -----------------------
  // Wait for email to appear in Inbox
  // -----------------------
  async waitForEmailInInbox(page: Page, subject: string, timeout = 120000) {
    await page.click('text=Inbox').catch(() => {});
    await page.waitForSelector(`text=${subject}`, { timeout });
    console.log(`Email with subject "${subject}" appeared in Inbox`);
  }

  // -----------------------
  // Open email by subject
  // -----------------------
  async openEmailBySubject(page: Page, subject: string) {
    await page.click(`text=${subject}`);
    await page.waitForSelector('text=Attachments', { timeout: 20000 }).catch(() => {});
    console.log(`Email with subject "${subject}" opened`);
  }

  // -----------------------
  // Save all attachments to Documents
  // -----------------------
  async saveAttachmentToDocuments(page: Page) {
    const downloadAllButton = page.locator('button[data-testid="attachment-list:download-all"]');
    await expect(downloadAllButton).toBeVisible({ timeout: 15000 });

    const downloadsPath = path.resolve(__dirname, '../../Documents');
    if (!fs.existsSync(downloadsPath)) fs.mkdirSync(downloadsPath, { recursive: true });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadAllButton.click(),
    ]);

    const filePath = path.join(downloadsPath, await download.suggestedFilename());
    await download.saveAs(filePath);
    console.log(`All attachments saved to: ${filePath}`);
  }

  // -----------------------
  // Move email to Trash
  // -----------------------
  async moveEmailToTrash(page: Page) {
    const moveToTrashBtn = page.locator('button:has-text("Move to trash")').first();
    await expect(moveToTrashBtn).toBeVisible({ timeout: 10000 });
    await moveToTrashBtn.click();
    console.log('Email moved to Trash');
  }

  // -----------------------
  // Verify email in Trash
  // -----------------------
  async verifyEmailInTrash(page: Page, subject: string) {
    // Expand "More" menu if necessary
    const moreBtn = page.locator('button[title="More"]');
    if (await moreBtn.isVisible()) await moreBtn.click();

    // Go to Trash
    const trashLink = page.locator('span[title^="Trash"]');
    await expect(trashLink).toBeVisible({ timeout: 10000 });
    await trashLink.click();
    console.log('Clicked on Trash');

    // Email container by subject
    const emailContainer = page.locator(`div[data-testid="message-item:${subject}"]`);

    // Scroll to email
    await emailContainer.scrollIntoViewIfNeeded();

    const count = await emailContainer.count();

    if (count === 0) {
      // Debugging: print all email subjects in Trash
      const allSubjects = await page.$$eval(
        'div[data-testid^="message-item:"]',
        nodes => nodes.map(n => n.getAttribute('data-testid'))
      );
      console.log('All emails in Trash:', allSubjects);
      throw new Error(`Email with subject "${subject}" not found in Trash`);
    }

    console.log(`Email with subject "${subject}" found in Trash`);
  }
}
