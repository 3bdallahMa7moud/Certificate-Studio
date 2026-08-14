import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { after, before, test } from 'node:test';

import react from '@vitejs/plugin-react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let server;
let Icon;
let hasIcon;

before(async () => {
  server = await createServer({
    root: process.cwd(),
    configFile: false,
    appType: 'custom',
    logLevel: 'silent',
    optimizeDeps: { disabled: true, noDiscovery: true, include: [] },
    ssr: { optimizeDeps: { disabled: true, noDiscovery: true, include: [] } },
    plugins: [react()],
    server: { middlewareMode: true },
  });
  ({ default: Icon, hasIcon } = await server.ssrLoadModule('/components/Icon.jsx'));
});

after(async () => {
  await server?.close();
});

function sourceFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(?:js|jsx)$/.test(entry.name) ? [target] : [];
  });
}

function staticallyUsedIconNames() {
  const names = new Set();
  const roots = ['components', 'pages', 'src', 'qa']
    .map(directory => path.resolve(directory));

  for (const filename of roots.flatMap(sourceFiles)) {
    const source = readFileSync(filename, 'utf8');

    for (const tag of source.matchAll(/<Icon\b[^>]*>/g)) {
      for (const literal of tag[0].matchAll(/["']([A-Z][A-Za-z0-9]+)["']/g)) {
        names.add(literal[1]);
      }
    }

    for (const property of source.matchAll(/\bicon\s*:\s*["']([A-Z][A-Za-z0-9]+)["']/g)) {
      names.add(property[1]);
    }
  }

  return [...names].sort();
}

test('iconMap covers every statically declared application icon', () => {
  const missing = staticallyUsedIconNames().filter(name => !hasIcon(name));
  assert.deepEqual(missing, [], `Missing iconMap entries: ${missing.join(', ')}`);
});

test('Icon forwards className and ordinary SVG props', () => {
  const markup = renderToStaticMarkup(
    React.createElement(Icon, {
      name: 'Check',
      size: 21,
      strokeWidth: 2.5,
      className: 'qa-icon-probe',
      role: 'img',
      'aria-label': 'Ready',
      'data-probe': 'forwarded',
    }),
  );

  assert.match(markup, /^<svg\b/);
  assert.match(markup, /class="[^"]*qa-icon-probe[^"]*"/);
  assert.match(markup, /role="img"/);
  assert.match(markup, /aria-label="Ready"/);
  assert.match(markup, /data-probe="forwarded"/);
  assert.match(markup, /data-icon-name="Check"/);
  assert.match(markup, /width="21"/);
  assert.match(markup, /height="21"/);
  assert.match(markup, /stroke-width="2.5"/);
});

test('an unknown icon fails explicitly instead of rendering a generic fallback', () => {
  const previousError = console.error;
  const messages = [];
  console.error = (...args) => messages.push(args.join(' '));
  try {
    const markup = renderToStaticMarkup(
      React.createElement(Icon, { name: 'DefinitelyMissingIcon' }),
    );
    assert.equal(markup, '');
  } finally {
    console.error = previousError;
  }
  assert.ok(messages.some(message => message.includes('DefinitelyMissingIcon')));
});
