abstract class Component<T extends Node = Node> {
  _children = new Set<Component<Node>>();

  private _node?: T;

  get node() {
    return (this._node ||= this.render());
  }

  abstract render(): T;

  protected connect(components: Component<Node>[]) {
    for (const component of components) {
      this._children.add(component);
    }
  }

  protected disconnect(components: Component<Node>[]) {
    for (const component of components) {
      this._children.delete(component);
    }
  }

  destroy(): void {
    this._node?.parentNode?.removeChild(this._node);
    this.onDisconnect?.();

    for (const child of this._children.values()) {
      child.destroy();
    }
  }

  onDisconnect?(): void;
}

export { Component };
