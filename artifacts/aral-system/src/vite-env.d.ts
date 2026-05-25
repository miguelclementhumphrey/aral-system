/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PORT: string;
  readonly BASE_PATH: string;
  readonly NODE_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
