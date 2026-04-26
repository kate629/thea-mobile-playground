import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/preset-create-react-app",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "happo/storybook/preset"
  ],
  "framework": "@storybook/react-webpack5",
  "staticDirs": [
    "../public"
  ],
  // Stable styled-components classnames across builds so Happo's
  // DOM-hash cache survives unrelated commits. Without this plugin
  // the runtime classname suffixes (e.g. `sc-bdVaJa hLoRig`) can shift
  // between builds, busting the cache and re-billing every snapshot
  // even when no source changed.
  babel: async (config) => ({
    ...config,
    plugins: [
      ...(config.plugins || []),
      [
        'babel-plugin-styled-components',
        { displayName: true, fileName: true, ssr: false },
      ],
    ],
  }),
};
export default config;