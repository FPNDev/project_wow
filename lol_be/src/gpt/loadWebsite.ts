import axios from 'axios';
import { JSDOM } from 'jsdom';

const trimResponse = (text: string) =>
  text.replace(/\s{2,}/g, ' ').slice(0, 35000);

const findParent = (node: Node, nodeName: string) => {
  let parent = node.parentNode;
  while (parent) {
    if (parent.nodeName === nodeName) {
      return true;
    }
    parent = parent.parentNode;
  }
  return false;
};

const loadWebsite = async (websiteLink: string) => {
  const text = await axios<string>(websiteLink, { responseType: 'text' })
    .then((r) => r.data)
    .catch(() => '');

  const { window } = new JSDOM(text);

  const articles = [...window.document.querySelectorAll('article')];
  if (articles.length) {
    return trimResponse(
      articles
        .filter((a) => !findParent(a, 'ARTICLE'))
        .map((v) => v.innerText)
        .join('\n')
    );
  }

  const main = window.document.querySelector(
    'main,#main,#content,#main-content'
  );
  return trimResponse(main?.textContent ?? window.document.body.innerText ?? '');
};

export { loadWebsite };
