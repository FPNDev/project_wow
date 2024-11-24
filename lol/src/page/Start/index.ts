import { LoadingWithInfo } from '../../component/LoadingWithInfo/LoadingWithInfo';
import { TextArea } from '../../component/TextArea/TextArea';
import { Component } from '../../local_modules/component/component';
import { router } from '../../routing';
import {
  createThread,
  getQuestionFromThread,
  GPTFileAccept,
  setTopic,
} from '../../service/learnGPT';
import { html } from '../../util/dom-manipulation';
import classes from './style.module.scss';

export class Start extends Component {
  render() {
    const materialField = new TextArea();
    const topicField = new TextArea();

    materialField.node.classList.add(classes.materialField);
    topicField.node.classList.add(classes.topicField);

    this.connect([materialField, topicField]);

    const fileField = html`<input
      type="file"
      multiple
      accept="${GPTFileAccept}"
    />` as HTMLInputElement;
    const fileFieldWrapper = html`
      <div class="no-display">
        <h3>та додайте файли (необов'язково)</h3>
        ${fileField}
      </div>
    ` as HTMLDivElement;

    const continueButton = html`<button class="button ${classes.continueBtn}">
      Продовжити
    </button>` as HTMLButtonElement;

    const footer = html`
      <div class="${classes.footer}">${continueButton}</div>
    `;

    let creatingThread = false;
    continueButton.onclick = materialField.node.onsubmit = async () => {
      if (!creatingThread) {
        const textTrimmed = materialField.value.trim();
        const topicTrimmed = topicField.value.trim();
        if (!textTrimmed && !fileField.files?.length) {
          alert('Please, provide materials to start');
          return;
        }

        creatingThread = true;

        const loadingSteps = [];

        loadingSteps.push({
          text: 'Processing materials...',
          fn: () => createThread(textTrimmed, fileField.files),
        });
        if (topicTrimmed) {
          loadingSteps.push({
            text: 'Setting up a topic...',
            fn: (threadId: string) =>
              setTopic(threadId, topicTrimmed).then(() => threadId),
          });
        }
        loadingSteps.push({
          text: 'Creating questions...',
          fn: (threadId: string) => getQuestionFromThread(threadId, 0),
        });

        const loadingText = new LoadingWithInfo<[string]>(loadingSteps);
        this.connect([loadingText]);

        continueButton.classList.add('no-display');
        footer.appendChild(loadingText.node);

        let newThread!: string;

        try {
          [newThread] = await loadingText.loadedPromise$;
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
          підтримуються - текст, посилання. Можна задати декілька матеріалів одразу
        </h4>
        ${materialField.node}
        <h3>Задайте тему запитань (необов'язково)</h3>
        ${topicField.node} ${fileFieldWrapper} ${footer}
      </div>
    `;
  }
}
