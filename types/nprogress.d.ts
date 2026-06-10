declare module "nprogress" {
  interface NProgressOptions {
    minimum?: number;
    easing?: string;
    positionUsing?: string;
    speed?: number;
    trickle?: boolean;
    trickleSpeed?: number;
    showSpinner?: boolean;
    parent?: string;
    template?: string;
  }

  interface NProgressStatic {
    configure(options: NProgressOptions): NProgressStatic;
    start(): NProgressStatic;
    done(force?: boolean): NProgressStatic;
    inc(amount?: number): NProgressStatic;
    set(n: number): NProgressStatic;
    remove(): void;
    isStarted(): boolean;
  }

  const NProgress: NProgressStatic;
  export = NProgress;
}
