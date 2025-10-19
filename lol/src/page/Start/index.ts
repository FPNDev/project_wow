import { LoadingWithInfo } from '../../component/LoadingWithInfo/LoadingWithInfo';
import { TextArea } from '../../component/TextArea/TextArea';
import { Component } from '../../local_modules/component/component';
import { router } from '../../routing';
import {
  createThread,
  getQuestionFromThread,
  setTopic,
} from '../../service/learnGPT';
import { html } from '../../local_modules/util/dom-manipulation';
import classes from './style.module.scss';

export class Start extends Component {
  view() {
    const materialField = new TextArea('', 'Material', classes.materialField);
    const topicField = new TextArea('', 'Topic (optional)', classes.topicField);

    this.attach([materialField, topicField]);

    const materialFieldView = materialField.ensureView();

    const continueButton = <HTMLButtonElement>(
      html`<button class="button ${classes.continueBtn}">Продовжити</button>`
    );

    const footer = <HTMLDivElement>(
      html` <div class="${classes.footer}">${continueButton}</div> `
    );

    let creatingThread = false;
    continueButton.onclick = materialFieldView.onsubmit = async () => {
      if (!creatingThread) {
        const text = materialField.value;
        const topic = topicField.value;
        if (!text) {
          alert('Задайте будь ласка матеріали для обробки');
          return;
        }

        creatingThread = true;

        const loadingSteps = [];

        loadingSteps.push({
          text: 'Оборобляємо матеріали...',
          fn: () => createThread(text),
        });
        if (topic) {
          loadingSteps.push({
            text: 'Встановлюємо тему...',
            fn: (threadId: string) =>
              setTopic(threadId!, topic).then(() => threadId!),
          });
        }
        loadingSteps.push({
          text: 'Створюємо питання...',
          fn: (threadId: string) =>
            getQuestionFromThread(threadId!, 0).then(() => threadId),
        });
        const loadingText = new LoadingWithInfo<string>(loadingSteps);
        this.attach([loadingText]);

        continueButton.classList.add('no-display');
        footer.appendChild(loadingText.ensureView());

        let newThread: string | undefined;

        try {
          newThread = await loadingText.start();
        } catch (e: unknown) {
          alert((<Error>e).message);
        }

        continueButton.classList.remove('no-display');
        loadingText.destroy();
        creatingThread = false;

        if (newThread) {
          router.go(`/thread/${newThread}`);
        }
      }
    };

    return html`
      <div class="${classes.startPage}">
        <h1>Задайте матеріали для роботи</h1>

        <h4 class="${classes.headingHint}">
          підтримуються - текст, посилання. Можна задати декілька матеріалів
          одразу
        </h4>
        ${materialField}

        <h3>Задайте тему запитань (необов'язково)</h3>
        ${topicField} ${footer}
      </div>
    `;
  }
}
