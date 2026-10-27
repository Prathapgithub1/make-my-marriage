declare const process: {
  readonly env: {
    readonly NODE_ENV?: string;
    readonly API_BASE_URL?: string;
    readonly AUTH_DEMO_MODE?: string;
  };
};

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module 'url:*' {
  const src: string;
  export default src;
}
