import { Component } from '../../local_modules/component/component';
import { element, html } from '../../local_modules/util/dom-manipulation';
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

  view(placeholderText: string, className?: string): HTMLDivElement {
    const placeholder = <HTMLDivElement>(
      html`
        <div class=${classes.textfieldPlaceholder}>${placeholderText}</div>
      `
    );
    const textField = <HTMLDivElement>(
      html`<div contenteditable>${this._value}</div>`
    );

    const showOrHidePlaceholder = () => {
      if (this._value.length) {
        placeholder.classList.add('no-display');
      } else {
        placeholder.classList.remove('no-display');
      }
    };
    showOrHidePlaceholder();

    textField.addEventListener('input', () => {
      this._value = textField.innerText.trim();
      showOrHidePlaceholder();
    });
    textField.addEventListener('paste', (e) => {
      e.preventDefault();

      // replace windows style new lines with unix style ones
      // to keep caret visibility after paste
      const plainText =
        e.clipboardData?.getData('Text').replace(/\r\n/g, '\n') ?? '';

      const currentSelection = document.getSelection()!;
      const firstRange = currentSelection.getRangeAt(0)!;
      // remove all selected content
      firstRange.deleteContents();
      while (currentSelection.rangeCount > 1) {
        const range = currentSelection.getRangeAt(1);
        range.deleteContents();
        currentSelection.removeRange(range);
      }

      const insertedNode = element('span');
      insertedNode.textContent = plainText;
      firstRange.insertNode(insertedNode);
      firstRange.collapse(false);

      const rightDiff =
        insertedNode.offsetLeft +
        insertedNode.offsetWidth -
        textField.scrollLeft -
        textField.offsetWidth;

      const bottomDiff =
        insertedNode.offsetTop +
        insertedNode.offsetHeight -
        scrollableFieldWrapper.scrollTop -
        scrollableFieldWrapper.clientHeight;

      if (rightDiff > 0) {
        textField.scrollLeft += rightDiff;
      }
      if (bottomDiff > 0) {
        scrollableFieldWrapper.scrollTop += bottomDiff;
      }

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

    const scrollableFieldWrapper = <HTMLDivElement>(
      html`
        <div class="${classes.textfieldContent} textfield-content">
          ${textField}
        </div>
      `
    );

    return html`
      <div class="${classes.textfield} ${className}">
        ${placeholder} ${scrollableFieldWrapper}
      </div>
    ` as HTMLDivElement;
  }
}
