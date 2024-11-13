declare global {
  declare const navigator: Navigator & {
    userAgentData: {
      brands: { brand: string; version: string }[];
      mobile: boolean;
      platform: string;
    };
  };
}
