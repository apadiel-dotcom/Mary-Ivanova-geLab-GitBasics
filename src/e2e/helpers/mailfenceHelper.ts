import { Page, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export class MailfenceHelper {
  // -------------------
  // Логин пользователя
  // -------------------
  async login(page: Page, username: string, password: string) {
    await page.fill('#username', username);
    await page.fill('#password', password);
    await page.click('button:has-text("Sign in")');
    await page.waitForSelector('text=Inbox', { timeout: 60000 });
    console.log('✅ Пользователь залогинился и находится в Inbox');
  }

  // -------------------------------------------------
  // Составляем и отправляем письмо с вложением
  // -------------------------------------------------
  async composeAndSendEmail(page: Page, subject: string, body: string, attachmentPath: string) {
    await page.click('[data-testid="sidebar:compose"]'); 
    await page.waitForSelector('.composer-container', { timeout: 10000 });
    console.log('✉️ Открыл форму создания письма');

    const toEmail = process.env.MAILFENCE_USER!;
    await page.fill('input[data-testid="composer:to"]', toEmail);
    await page.fill('input[data-testid="composer:subject"]', subject);
    console.log(`✉️ Заполнены поля To: ${toEmail} и Subject: ${subject}`);

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
    console.log('✉️ Тело письма заполнено');

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      const absolutePath = path.isAbsolute(attachmentPath)
        ? attachmentPath
        : path.resolve(__dirname, '../test-data', attachmentPath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Файл не найден по пути: ${absolutePath}`);
      }
      await fileInput.setInputFiles(absolutePath);
      console.log(`📎 Вложение установлено: ${absolutePath}`);
    } else {
      throw new Error('Не найден элемент для загрузки файла (input[type="file"]).');
    }

    await page.click('button[data-testid="composer:send-button"]');
    await page.waitForSelector('text=Message sent', { timeout: 20000 }).catch(() => {});
    console.log(`✅ Письмо с темой "${subject}" отправлено`);
  }

  // -----------------------
  // Ждем появления письма в Inbox
  // -----------------------
  async waitForEmailInInbox(page: Page, subject: string, timeout = 120000) {
    await page.click('text=Inbox').catch(() => {});
    await page.waitForSelector(`text=${subject}`, { timeout });
    console.log(`📥 Письмо с темой "${subject}" появилось в Inbox`);
  }

  // -----------------------
  // Открыть письмо по теме
  // -----------------------
  async openEmailBySubject(page: Page, subject: string) {
    await page.click(`text=${subject}`);
    await page.waitForSelector('text=Attachments', { timeout: 20000 }).catch(() => {});
    console.log(`📬 Письмо с темой "${subject}" открыто`);
  }

  // -----------------------
  // Сохранить все вложения в Documents
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
    console.log(`📄 Все вложения сохранены в: ${filePath}`);
  }

  // -----------------------
  // Перемещаем письмо в корзину
  // -----------------------
  async moveEmailToTrash(page: Page) {
    const moveToTrashBtn = page.locator('button:has-text("Move to trash")').first();
    await expect(moveToTrashBtn).toBeVisible({ timeout: 10000 });
    await moveToTrashBtn.click();
    console.log('🗑 Письмо перемещено в Trash');
  }

  // -----------------------
  // Проверка письма в корзине
  // -----------------------
  async verifyEmailInTrash(page: Page, subject: string) {
    // Разворачиваем меню "More", если нужно
    const moreBtn = page.locator('button[title="More"]');
    if (await moreBtn.isVisible()) await moreBtn.click();

    // Переходим в Trash
    const trashLink = page.locator('span[title^="Trash"]');
    await expect(trashLink).toBeVisible({ timeout: 10000 });
    await trashLink.click();
    console.log('🗑 Нажали на Trash');

    // Локатор для контейнера письма по теме
    const emailContainer = page.locator(`div[data-testid="message-item:${subject}"]`);

    // Прокручиваем к письму
    await emailContainer.scrollIntoViewIfNeeded();

    const count = await emailContainer.count();

    if (count === 0) {
      // Для отладки выводим все контейнеры
      const allSubjects = await page.$$eval(
        'div[data-testid^="message-item:"]',
        nodes => nodes.map(n => n.getAttribute('data-testid'))
      );
      console.log('📃 Все письма в Trash:', allSubjects);
      throw new Error(`❌ Письмо с темой "${subject}" не найдено в Trash`);
    }

    console.log(`✅ Письмо с темой "${subject}" найдено в Trash`);
  }
}
