import { html, text } from '../../local_modules/util/dom-manipulation';
import { listenerGroup } from '../../local_modules/util/listeners';
import classes from './style.module.scss';

export function TextAreaTest(
  value = '',
  placeholderText = '',
  className?: string,
) {
  const listeners = listenerGroup();

  const placeholder = <HTMLDivElement>(
    html`<div class=${classes.textfieldPlaceholder}>${placeholderText}</div>`
  );
  const textField = <HTMLDivElement>html`<div contenteditable>${value}</div>`;

  const showOrHidePlaceholder = () => {
    if (value.length) {
      placeholder.classList.add('no-display');
    } else {
      placeholder.classList.remove('no-display');
    }
  };
  showOrHidePlaceholder();

  listeners.add(textField, 'input', () => {
    value = textField.textContent!.replace(/^\n/, '');
    showOrHidePlaceholder();
  });
  listeners.add(textField, 'paste', (e) => {
    e.preventDefault();
    const plainText = e.clipboardData?.getData('text/plain') ?? '';
    const currentSelection = document.getSelection()!;

    const firstRange = currentSelection.getRangeAt(0)!;
    let range = firstRange;
    let idx = 0;
    do {
      range.deleteContents();
    } while (
      ++idx < currentSelection.rangeCount &&
      (range = currentSelection.getRangeAt(idx))
    );
    currentSelection.removeAllRanges();

    firstRange.insertNode(text(plainText));

    const selectionControl = getSelection()!;
    selectionControl.removeAllRanges();
    selectionControl.addRange(firstRange);
    selectionControl.collapseToEnd();

    textField.scrollTop = textField.scrollHeight;
    textField.dispatchEvent(
      new InputEvent('input', { inputType: 'insertFromPaste' }),
    );
  });

  textField.addEventListener('keydown', (ev) => {
    if (
      ev.code === 'Enter' &&
      ev.shiftKey &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !(navigator as any).userAgentData?.mobile
    ) {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();

      componentRender.dispatchEvent(new SubmitEvent('submit'));
    }
  });

  const componentRender = <HTMLDivElement>(
    html`
      <div class="${classes.textfield} ${className}">
        ${textField} ${placeholder}
      </div>
    `
  );

  return [
    componentRender,
    () => listeners.stopAll(),
    {
      get value() {
        return value;
      },
    },
  ] as const;
}
