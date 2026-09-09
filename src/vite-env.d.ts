/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MP_PUBLIC_KEY?: string;
  readonly VITE_MP_ACCESS_TOKEN?: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
