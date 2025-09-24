import { Component } from '../../local_modules/component/component';
import { text } from '../../local_modules/util/dom-manipulation';

type LoadingStep = {
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (lastValue?: any) => Promise<unknown>;
};

export class LoadingWithInfo<T extends unknown[]> extends Component<Text> {
  readonly loadedPromise$: Promise<T>;

  constructor(steps: LoadingStep[]) {
    super();
    
    this.renderStep(steps[0], 0, steps.length);

    let stepsChained = Promise.resolve() as Promise<unknown>;
    const resolvedValues: unknown[] = [];
    for (let i = 0; i < steps.length; i++) {
      stepsChained = stepsChained
        .then(() => steps[i].fn(i ? resolvedValues[i - 1] : undefined))
        .then((v) => {
          resolvedValues.push(v);
          if (i < steps.length - 1) {
            this.renderStep(steps[i + 1], i + 1, steps.length);
          } else {
            return resolvedValues;
          }
        });
    }

    this.loadedPromise$ = stepsChained as Promise<T>;
  }

  render(): Text {
    return text();
  }

  private renderStep(step: LoadingStep, index: number, length: number) {
    this.node.textContent = `${step.text} (${index + 1}/${length})`;
  }
}
