/** Inputs and expected public CLI outputs. The central runner owns execution. */
export type Scenario = {
  name: string;
  input: unknown;
  expected: unknown;
  exitCode?: number;
  rawInput?: string;
};
