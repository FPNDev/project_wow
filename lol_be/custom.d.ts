declare module '@docwagen/unoserver-node' {
  export class Unoserver {
    constructor(shouldDebug = false);
    setServerInterface(interface: string): this;
    setPort(port: number): this;
    makeDaemon(): this;
    run(): unknown;
  }
}

declare global {
  declare const navigator: Navigator & {
    userAgentData: {
      brands: { brand: string; version: string }[];
      mobile: boolean;
      platform: string;
    };
  };
}
