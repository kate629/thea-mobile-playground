// happo.config.ts
import { defineConfig } from 'happo';

export default defineConfig({
  apiKey: process.env.HAPPO_API_KEY!,
  apiSecret: process.env.HAPPO_API_SECRET!,

  project: 'default',
  integration: {
    type: 'storybook',
  },

  // https://docs.happo.io/docs/configuration#targets
  // Two targets per story = ~33% fewer snapshots vs adding accessibility.
  // Re-add a third target only if there's an active reviewer for it.
  targets: {
    'chrome-large': {
      type: 'chrome',
      viewport: '1200x900',
    },

    'chrome-small': {
      type: 'chrome',
      viewport: '375x667',
    },
  },
});
