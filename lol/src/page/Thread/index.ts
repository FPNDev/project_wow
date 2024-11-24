import { TextArea } from '../../component/TextArea/TextArea';
import { Component } from '../../local_modules/component/component';
import { router, routes } from '../../routing';
import {
  getQuestionFromThread,
  QuestionData,
  setTopic,
} from '../../service/learnGPT';
import {
  appendChildren,
  escHTML,
  html,
  mhtml,
} from '../../util/dom-manipulation';
import { listenerGroup } from '../../util/listeners';

import classes from './style.module.scss';

export class Thread extends Component {
  private listeners = listenerGroup();

  private questionElement!: HTMLElement;
  private quoteElement!: HTMLElement;
  private prevBtn!: HTMLElement;
  private nextBtn!: HTMLElement;

  private threadId!: string;
  private questionIdx = 0;

  private loadingQuestion = false;
  private nextAllowed = false;

  render() {
    this.renderBackButton();
    this.renderNextButton();

    this.addKeyEventListeners();

    this.parseThreadAndQuestionId();
    this.loadQuestion();

    this.listeners.add(window, 'routeChange', () => {
      this.parseThreadAndQuestionId();
      this.loadQuestion();
    });

    return html`
      <div class="${classes.thread}">
        ${this.renderQuestion()}
        <div class="${classes.footer}">
          ${this.renderQuote()} ${this.renderTopicInput()} ${this.prevBtn}
          ${this.nextBtn}
        </div>
      </div>
    `;
  }

  onDisconnect(): void {
    this.listeners.stopAll();
  }

  private addKeyEventListeners() {
    this.listeners.add(document, 'keydown', (ev) => {
      if (
        document.activeElement &&
        document.activeElement.hasAttribute('contenteditable')
      ) {
        return;
      }

      const keyCode = (ev as KeyboardEvent).key;
      if (keyCode === 'Enter' || keyCode === 'ArrowRight' || keyCode === ' ') {
        this.goNext();
      } else if (
        (keyCode === 'ArrowLeft' || keyCode === 'Backspace') &&
        this.questionIdx
      ) {
        this.goPrev();
      }
    });
  }

  private goPrev() {
    if (this.loadingQuestion) {
      return;
    }

    history.pushState(
      null,
      '',
      `/thread/${this.threadId}/${--this.questionIdx}`,
    );
    this.loadQuestion();
  }

  private goNext() {
    if (!this.nextAllowed || this.loadingQuestion) {
      return;
    }

    history.pushState(
      null,
      '',
      `/thread/${this.threadId}/${++this.questionIdx}`,
    );
    this.loadQuestion();
  }

  private allowNext() {
    this.nextBtn.classList.remove('no-display');
    this.nextAllowed = true;
  }

  private disallowNext() {
    this.nextBtn.classList.add('no-display');
    this.nextAllowed = false;
  }

  private showQuote(quoteText: string) {
    this.quoteElement.textContent = quoteText;
    this.quoteElement.classList.remove('no-display');
  }
  private hideQuote() {
    this.quoteElement.classList.add('no-display');
  }

  private renderQuote() {
    return (this.quoteElement = html`<div
      class="${classes.quote} no-display"
    ></div>` as HTMLDivElement);
  }

  private parseThreadAndQuestionId() {
    let questionIdx;
    [, this.threadId, questionIdx] = location.pathname.match(
      routes.thread.path,
    )!;

    if (questionIdx === undefined) {
      history.replaceState(null, '', `/thread/${this.threadId}/0`);
    }
    this.questionIdx = +(questionIdx ?? 0);
  }

  private renderOptions(question: QuestionData) {
    const optionBtns = question.answers.map((answer) => {
      const btn = html`<button class="button ${classes.option}">
        ${escHTML(answer)}
      </button>` as HTMLButtonElement;

      btn.onclick = () => {
        for (let i = 0; i < optionBtns.length; i++) {
          optionBtns[i].onclick = null;
          optionBtns[i].classList.remove(classes.active);
          optionBtns[i].classList.add(
            i === 0 ? classes.correct : classes.wrong,
          );
        }
        btn.classList.add(classes.active);
        this.allowNext();
        this.showQuote(question.quote);
      };

      return btn;
    }) as HTMLButtonElement[];

    const randomOrderBtns = [...optionBtns];

    for (let i = 0; i < randomOrderBtns.length; i++) {
      const newIdx = Math.floor(Math.random() * randomOrderBtns.length);
      [randomOrderBtns[i], randomOrderBtns[newIdx]] = [
        randomOrderBtns[newIdx],
        randomOrderBtns[i],
      ];
    }

    return randomOrderBtns;
  }

  private loadQuestion() {
    this.setBackButtonVisibility();
    this.disallowNext();

    if (!this.loadingQuestion) {
      this.loadingQuestion = true;

      return getQuestionFromThread(this.threadId, this.questionIdx)
        .then((question) => {
          this.hideQuote();

          this.questionElement.innerHTML = '';
          appendChildren(
            this.questionElement,
            mhtml`
            <h2>#${this.questionIdx + 1}: ${escHTML(question.question)}</h2>
            <div class="${classes.options}">
              ${this.renderOptions(question)}
            </div>
          `,
          );

          this.loadingQuestion = false;
        })
        .catch((e) => {
          this.loadingQuestion = false;

          alert(
            e instanceof Error
              ? e.message
              : 'Помилка завантаження питання. debug: ' + JSON.stringify(e),
          );

          if (this.questionIdx) {
            this.loadingQuestion = false;
            this.goPrev();
          } else {
            router.go('/'); 
          }
        });
    }

    return Promise.reject('question already loading');
  }

  private renderQuestion() {
    return (this.questionElement ||= html`<div
      class="${classes.questionSection}"
    ></div>` as HTMLDivElement);
  }

  private renderBackButton() {
    if (!this.prevBtn) {
      this.prevBtn = html`<button class="button ${classes.backBtn}">
        Prev
      </button>` as HTMLButtonElement;
      this.setBackButtonVisibility();
      this.prevBtn.onclick = () => this.goPrev();
    }

    return this.prevBtn;
  }

  private setBackButtonVisibility() {
    if (this.questionIdx === 0) {
      this.prevBtn.classList.add('no-display');
    } else if (this.prevBtn.classList.contains('no-display')) {
      this.prevBtn.classList.remove('no-display');
    }
  }

  private renderNextButton() {
    if (!this.nextBtn) {
      this.nextBtn = html`<button class="button no-display ${classes.nextBtn}">
        Next
      </button>` as HTMLButtonElement;

      this.nextBtn.onclick = () => this.goNext();
    }
  }

  private renderTopicInput() {
    const inputElement = new TextArea('', 'Questions topic (any format)');
    const submitBtn = html`<button class="button">
      OK
    </button>` as HTMLButtonElement;

    this.connect([inputElement]);

    submitBtn.onclick = inputElement.node.onsubmit = async () => {
      submitBtn.classList.add('disabled');

      const newTopic = inputElement.value.trim();
      try {
        const topicStartsAt = await setTopic(this.threadId, newTopic);

        alert(
          `Тему змінено на "${newTopic}".\nТему змінено після питання #${topicStartsAt}`,
        );
      } catch (e) {
      } finally {
      }
      submitBtn.classList.remove('disabled');
    };

    return html`<div class="${classes.topicSection}">
      ${inputElement.node} ${submitBtn}
    </div>`;
  }
}
