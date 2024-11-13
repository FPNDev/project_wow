import { Component } from '../../local_modules/component/component';
import { html } from '../../util/dom-manipulation';

export class TextArea extends Component<HTMLDivElement> {
  private placeholder = '';
  private _value = '';

  get value() {
    return this._value;
  }

  constructor(value = '', placeholder = '') {
    super();
    this._value = value;
    this.placeholder = placeholder;
  }

  render(): HTMLDivElement {
    const placeholder = html`
      <div class="textfield-placeholder">${this.placeholder}</div>
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
      const text = e.clipboardData?.getData('text/plain') ?? '';
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

      firstRange.insertNode(document.createTextNode(text));

      const selectionControl = getSelection()!;
      selectionControl.removeAllRanges();
      selectionControl.addRange(firstRange);
      selectionControl.collapseToEnd();

      textField.scrollTop = textField.scrollHeight;
      textField.dispatchEvent(
        new InputEvent('input', { data: textField.innerText }),
      );
    });

    textField.addEventListener('keydown', (ev) => {
      if (
        ev.code === 'Enter' &&
        ev.shiftKey &&
        !(<any>navigator).userAgentData?.mobile
      ) {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        
        this.node.dispatchEvent(new SubmitEvent('submit'));
      }
    });

    return html`
      <div class="textfield">${textField} ${placeholder}</div>
    ` as HTMLDivElement;
  }
}
