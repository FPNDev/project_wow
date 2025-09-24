export default () => {
  const garbage = document.querySelectorAll('link, style, script');
  for (const part of garbage) {
    part.remove();
  }

  const articles = [...document.querySelectorAll('article')];
  if (articles.length) {
    const findParent = (node, nodeName) => {
      let parent = node.parentNode;
      while (parent) {
        if (parent.nodeName === nodeName) {
          return true;
        }
        parent = parent.parentNode;
      }
      return false;
    };

    return articles
      .filter((a) => !findParent(a, 'ARTICLE'))
      .map((v) => v.innerText)
      .join('\n');
  }

  const main = document.querySelector(
    'main,#main,#content,#main-content,#page-content'
  );
  return main?.textContent ?? document.body.innerText ?? '';
};
