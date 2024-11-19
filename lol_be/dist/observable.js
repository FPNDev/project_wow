"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Observable = void 0;
const Observable = (pipes = []) => {
    const observers = [];
    const doneObservers = [];
    let open = true;
    const subscribe = (observer) => {
        observers.push(observer);
        return () => {
            const idx = observers.indexOf(observer);
            if (idx !== -1) {
                observers.splice(idx, 1);
            }
        };
    };
    const subscribeDone = (observer) => {
        doneObservers.push(observer);
    };
    const notify = ((data) => {
        if (!open) {
            return;
        }
        const pipedData = pipes.reduce((acc, pipe) => pipe(acc), data);
        for (const observer of observers) {
            observer(pipedData);
        }
    });
    return {
        subscribe,
        subscribeDone,
        notify,
        pipe: (pipe) => Observable([...pipes, pipe]),
        done: () => {
            if (!open) {
                return;
            }
            open = false;
            observers.length = 0;
            let doneObserver;
            while ((doneObserver = doneObservers.shift())) {
                doneObserver();
            }
        },
        get closed() {
            return !open;
        },
    };
};
exports.Observable = Observable;
