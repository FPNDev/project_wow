import { createPage } from '../config/puppeteer';


const trimResponse = (text: string) =>
  text.replace(/\s{2,}/g, ' ').slice(0, 35000);

const loadWebsite = async (websiteLink: string) => {
  const page = await createPage();

  let text: string;

  try {
    await page.goto(websiteLink, { waitUntil: 'networkidle0' });
    text = await page.evaluate(
      await import('./extractMainFromPage.js').then((m) => m.default)
    );
  } catch (_) {
    console.log(_, typeof _ === 'object' && _ && 'message' in _ && _.message);
    return '';
  }

  return trimResponse(text);
};

export { loadWebsite };
