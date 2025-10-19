import { Component } from '../../local_modules/component/component';
import { text } from '../../local_modules/util/dom-manipulation';

type LoadingStep = {
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (lastValue?: any) => Promise<unknown>;
};

export class LoadingWithInfo<T> extends Component<Text> {
  start!: () => Promise<T>;

  constructor(steps: LoadingStep[]) {
    super();

    let stepsChained = new Promise<void>((resolve) => {
      this.start = () => {
        this.renderStep(steps[0], 0, steps.length);
        resolve();

        return loadedPromise$;
      };
    }) as Promise<unknown>;

    let currentVM: unknown;
    for (let i = 0; i < steps.length; i++) {
      stepsChained = stepsChained
        .then(() => steps[i].fn(currentVM))
        .then((v) => {
          if (i < steps.length - 1) {
            this.renderStep(steps[i + 1], i + 1, steps.length);
          } else {
            return v;
          }
          currentVM = v;
        });
    }

    const loadedPromise$ = stepsChained as Promise<T>;
  }

  view(): Text {
    return text();
  }

  private renderStep(step: LoadingStep, index: number, length: number) {
    this.node.textContent = `${step.text} (${index + 1}/${length})`;
  }
}
