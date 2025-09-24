export function appendChildren(parent: Node, children: (Node | null)[]) {
  for (let i = 0; i < children.length; i++) {
    if (children[i]) {
      parent.appendChild(children[i] as Node);
    }
  }
}
export function element(...params: Parameters<typeof document.createElement>) {
  return document.createElement(...params);
}

export function text(textValue = '') {
  return document.createTextNode(textValue);
}

const htmlRenderer = element('body');
const HTMLReplacementComment = '__htmlelement';

export function escHTML(text: string) {
  htmlRenderer.innerText = text;
  return htmlRenderer.innerHTML;
}
export function unescHTML(text: string) {
  htmlRenderer.innerHTML = text;
  return htmlRenderer.innerText;
}

export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Node {
  const nodes = mhtml(strings, ...values);

  if (nodes.length === 1) {
    return nodes[0];
  }

  throw new Error(
    'html literal used incorrectly, cannot find root or found multiple roots for given string literal'
  );
}

export function mhtml(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Node[] {
  let finalString = '';

  const recursiveReplaceElements = (localValues: unknown[]) => {
    for (let recursedIdx = 0; recursedIdx < localValues.length; recursedIdx++) {
      if (localValues[recursedIdx] instanceof Node) {
        finalString += `<!--${HTMLReplacementComment}-->`;
        elements.push(<Node>localValues[recursedIdx]);
      } else if (
        localValues[recursedIdx] !== null &&
        localValues[recursedIdx] !== undefined
      ) {
        finalString += localValues[recursedIdx]?.toString();
      } else if (Array.isArray(localValues[recursedIdx])) {
        recursiveReplaceElements(localValues[recursedIdx] as unknown[]);
      }
    }
  };

  const elements: Node[] = [];
  for (let idx = 0; idx < strings.length; idx++) {
    finalString += strings[idx];
    if (idx < values.length) {
      recursiveReplaceElements(
        Array.isArray(values[idx]) ? (values[idx] as unknown[]) : [values[idx]]
      );
    }
  }

  const rendererElement = element('body');
  rendererElement.innerHTML = finalString.trim();

  if (elements.length) {
    const iter = document.createNodeIterator(
      rendererElement,
      NodeFilter.SHOW_COMMENT,
      (node) =>
        node.nodeValue === HTMLReplacementComment
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP
    );
    let nextNode: Node | null;
    while ((nextNode = iter.nextNode())) {
      nextNode.parentNode?.replaceChild(elements.shift()!, nextNode);
    }
  }

  return [...rendererElement.childNodes];
}
