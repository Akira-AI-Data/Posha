declare module 'caveman' {
  type CavemanFn = ((template: string, data?: unknown) => string | ((engine: CavemanFn, data: unknown) => string)) & {
    register: (name: string, template: string | ((engine: CavemanFn, data: unknown) => string)) => void;
    render: (name: string, data?: unknown) => string;
  };

  const Caveman: CavemanFn;
  export default Caveman;
}
