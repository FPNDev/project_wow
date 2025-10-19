abstract class Component<T extends Node = Node> {
  private _childComponents = new Set<Component>();
  // MUST RENDER BEFORE ACCESSING NODE. RENDER IN CONSTRUCTOR WHEN POSSIBLE
  private _node!: T;
  protected get node() {
    return this._node;
  }

  ensureView(...args: unknown[]) {
    return (this._node ||= this.view(...args));
  }

  protected abstract view(...args: unknown[]): T;

  attach(childComponents: Component[]) {
    for (let i = 0, len = childComponents.length; i < len; i++) {
      this._childComponents.add(childComponents[i]);
    }
  }

  destroy() {
    this._node?.parentNode?.removeChild(this._node);
    this.onDisconnect?.();

    for (const child of this._childComponents.values()) {
      child.destroy();
    }
  }

  onDisconnect?(): void;
}

export { Component };
