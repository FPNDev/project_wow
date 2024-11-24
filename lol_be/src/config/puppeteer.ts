import puppeteer, { Browser } from 'puppeteer';

let browserPromise: Promise<Browser>;

const getBrowser = () => {
  return (browserPromise ||= puppeteer.launch({
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    headless: true,
  }));
};

const createPage = () =>
  getBrowser()
    .then((b) => b.newPage())
    .then((p) => {
      p.setUserAgent(
        'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/131.0.6778.70 Safari/537.36'
      );

      p.setRequestInterception(true);
      p.on('request', (req) => {
        const resourceType = req.resourceType();
        if (
          resourceType === 'image' ||
          resourceType === 'font' ||
          resourceType === 'media' ||
          resourceType === 'stylesheet' ||
          resourceType === 'websocket'
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });

      return p;
    });

export { createPage };
