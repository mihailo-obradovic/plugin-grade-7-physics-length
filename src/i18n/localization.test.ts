import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { pluginMessages } from './messages';

const locales = ['en', 'sr-latn', 'sr-cyrl'] as const;

describe('length converter localization', () => {
  it('has complete catalogs without migration placeholders', () => {
    const referenceKeys = Object.keys(pluginMessages.en).sort();

    for (const locale of locales) {
      expect(Object.keys(pluginMessages[locale]).sort()).toEqual(referenceKeys);
      expect(JSON.stringify(pluginMessages[locale])).not.toContain('TODO');
    }
  });

  it('contains localized controls in both Serbian scripts', () => {
    expect(pluginMessages['sr-latn'].checkButton).toBe('Provjeri odgovor');
    expect(pluginMessages['sr-cyrl'].checkButton).toBe('Провјери одговор');
  });

  it('renders through the live plugin locale channel', async () => {
    const source = await readFile(
      path.join(process.cwd(), 'src/Exercise.tsx'),
      'utf8'
    );

    expect(source).toContain('usePluginTranslations(context.i18n)');
    expect(source).not.toContain('Check answer');
  });

  it('packages message catalogs with the release artifacts', async () => {
    const source = await readFile(
      path.join(process.cwd(), 'scripts/package-github.mjs'),
      'utf8'
    );

    expect(source).toContain("path.join(repoRoot, 'src/i18n/messages')");
    expect(source).toContain("path.join(distDir, 'messages')");
  });
});
