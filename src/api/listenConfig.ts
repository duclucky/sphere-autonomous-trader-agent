export interface ListenConfig {
  host: string;
  port: number;
}

export function getListenConfig(env: NodeJS.ProcessEnv = process.env): ListenConfig {
  return {
    host: env.HOST ?? "0.0.0.0",
    port: Number(env.PORT ?? 8787)
  };
}
