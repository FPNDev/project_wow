import { Component } from '../../local_modules/component/component';
import { html, text } from '../../local_modules/util/dom-manipulation';
import classes from './style.module.scss';

export class TextArea extends Component<HTMLDivElement> {
  private _value = '';

  get value() {
    return this._value;
  }

  constructor(value = '', placeholder = '', className?: string) {
    super();
    this._value = value;
    this.createView(placeholder, className);
  }

  view(
    placeholderText: string,
    className?: string,
  ): HTMLDivElement {
    const placeholder = html`
      <div class=${classes.textfieldPlaceholder}>${placeholderText}</div>
    ` as HTMLDivElement;
    const textField = html`
      <div contenteditable>${this._value}</div>
    ` as HTMLDivElement;

    const showOrHidePlaceholder = () => {
      if (this._value.length) {
        placeholder.classList.add('no-display');
      } else {
        placeholder.classList.remove('no-display');
      }
    };
    showOrHidePlaceholder();

    textField.addEventListener('input', () => {
      this._value = textField.innerText.replace(/^\n/, '');
      showOrHidePlaceholder();
    });
    textField.addEventListener('paste', (e) => {
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

        this.node.dispatchEvent(new SubmitEvent('submit'));
      }
    });

    return html`
      <div class="${classes.textfield} ${className}">
        ${textField} ${placeholder}
      </div>
    ` as HTMLDivElement;
  }
}
