import { TextArea } from '../../component/TextArea/TextArea';
import { Component } from '../../local_modules/component/component';
import { router } from '../../routing';
import {
  getQuestionFromThread,
  QuestionData,
  setTopic,
} from '../../service/learnGPT';
import {
  appendChildren,
  element,
  escapeHTML,
  html,
  mhtml,
} from '../../local_modules/util/dom-manipulation';
import { eventSystem } from '../../local_modules/util/listeners';

import classes from './style.module.scss';

export class Thread extends Component {
  private events = eventSystem();

  private questionElement!: HTMLElement;
  private quoteElement!: HTMLElement;
  private prevBtn!: HTMLElement;
  private nextBtn!: HTMLElement;

  private threadId!: string;
  private questionIdx = 0;

  private loadingQuestion = false;
  private controlsAllowed = false;
  private hasAnswered = false;

  constructor() {
    super();

    this.ensureView();

    this.addKeyEventListeners();

    this.parseThreadAndQuestionId();
    this.loadQuestion();

    this.events.add(window, 'routeUpdate', () => {
      this.parseThreadAndQuestionId();
      this.loadQuestion();
    });
  }

  view() {
    this.renderBackButton();
    this.renderNextButton();

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
    this.events.stopAll();
  }

  private addKeyEventListeners() {
    this.events.add(document, 'keydown', (ev) => {
      if (
        document.activeElement &&
        document.activeElement.hasAttribute('contenteditable')
      ) {
        return;
      }

      const keyCode = (ev as KeyboardEvent).key;
      if (keyCode === 'Enter' || keyCode === 'ArrowRight' || keyCode === ' ') {
        if (keyCode === 'ArrowRight' || this.hasAnswered) {
          this.goNext();
        }
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
    if (!this.controlsAllowed || this.loadingQuestion) {
      return;
    }

    history.pushState(
      null,
      '',
      `/thread/${this.threadId}/${++this.questionIdx}`,
    );
    this.loadQuestion();
  }

  private allowControls() {
    this.setBackButtonVisibility();
    this.nextBtn.classList.remove('no-opacity', 'no-pointer');
    this.controlsAllowed = true;
  }

  private disallowControls() {
    this.prevBtn.classList.add('no-opacity', 'no-pointer');
    this.nextBtn.classList.add('no-opacity', 'no-pointer');
    this.controlsAllowed = false;
  }

  private showQuote(quoteText: string) {
    this.quoteElement.textContent = quoteText;
    this.quoteElement.classList.remove('no-display');
  }
  private hideQuote() {
    this.quoteElement.classList.add('no-display');
  }

  private renderQuote() {
    return (this.quoteElement = <HTMLDivElement>(
      html`<div class="${classes.quote} no-display"></div>`
    ));
  }

  private parseThreadAndQuestionId() {
    let questionIdx;
    [, this.threadId, questionIdx] = router.getQueryParams() as [
      unknown,
      string,
      string | undefined,
    ];

    if (questionIdx === undefined) {
      history.replaceState(null, '', `/thread/${this.threadId}/0`);
    }
    this.questionIdx = +(questionIdx ?? 0);
  }

  private renderOptions(question: QuestionData) {
    const optionBtns = question.answers.map((answer) => {
      const btn = <HTMLButtonElement>(
        html`<button class="button ${classes.option}">
          ${escapeHTML(answer)}
        </button>`
      );

      btn.onclick = () => {
        for (let i = 0; i < optionBtns.length; i++) {
          optionBtns[i].onclick = null;
          optionBtns[i].classList.remove(classes.active);
          optionBtns[i].classList.add(
            i === 0 ? classes.correct : classes.wrong,
          );
        }
        btn.classList.add(classes.active);
        this.showQuote(question.quote);
        this.hasAnswered = true;
      };

      return btn;
    });

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
    this.disallowControls();

    if (!this.loadingQuestion) {
      this.loadingQuestion = true;

      return getQuestionFromThread(this.threadId, this.questionIdx)
        .then((question) => {
          this.allowControls();
          this.hideQuote();
          this.hasAnswered = false;

          this.questionElement.innerHTML = '';
          appendChildren(
            this.questionElement,
            mhtml`
              <h2>#${this.questionIdx + 1}: ${escapeHTML(question.question)}</h2>
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
    return (this.questionElement ||= element('div'));
  }

  private renderBackButton() {
    if (!this.prevBtn) {
      this.prevBtn = <HTMLButtonElement>(
        html`<button class="button ${classes.backBtn}">Prev</button>`
      );
      this.prevBtn.onclick = () => this.goPrev();
    }
  }

  private setBackButtonVisibility() {
    if (this.questionIdx === 0) {
      this.prevBtn.classList.add('no-opacity', 'no-pointer');
    } else {
      this.prevBtn.classList.remove('no-opacity', 'no-pointer');
    }
  }

  private renderNextButton() {
    if (!this.nextBtn) {
      this.nextBtn = <HTMLButtonElement>(
        html`<button class="button ${classes.nextBtn}">Next</button>`
      );

      this.nextBtn.onclick = () => this.goNext();
    }
  }

  private renderTopicInput() {
    const topicInput = new TextArea('', '', classes.topicField);
    this.attach([topicInput]);

    const topicInputView = topicInput.ensureView();

    const submitBtn = <HTMLButtonElement>(
      html`<button class="button">OK</button>`
    );

    submitBtn.onclick = topicInputView.onsubmit = async () => {
      submitBtn.classList.add('disabled');

      const newTopic = topicInput.value.trim();
      try {
        const topicStartsAt = await setTopic(this.threadId, newTopic);

        alert(
          `Тему змінено на "${newTopic}".\nТему змінено після питання #${topicStartsAt}`,
        );
      } catch {
        alert('Не вдалося змінити тему. Спробуйте пізніше.');
      }

      submitBtn.classList.remove('disabled');
    };

    return html`<div class="${classes.topicSection}">
      ${topicInput} ${submitBtn}
    </div>`;
  }
}
