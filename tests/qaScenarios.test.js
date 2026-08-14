import assert from 'node:assert/strict';
import test from 'node:test';

import {
  QA_LANGUAGES,
  QA_PAPERS,
  QA_TEMPLATES,
  QA_VARIANTS,
  buildQaScenarios,
} from '../qa/certificate-scenarios.js';

const assets = Object.freeze({
  square: 'data:image/png;base64,U1FVQVJF',
  wide: 'data:image/png;base64,V0lERQ==',
  tall: 'data:image/png;base64,VEFMTA==',
});

test('QA matrix covers every template, paper size, and language mode', () => {
  const scenarios = buildQaScenarios(assets);
  const expectedCount = QA_TEMPLATES.length * QA_PAPERS.length * QA_LANGUAGES.length;

  assert.equal(QA_TEMPLATES.length, 12);
  assert.equal(QA_PAPERS.length, 2);
  assert.equal(QA_LANGUAGES.length, 3);
  assert.equal(scenarios.length, expectedCount);
  assert.equal(new Set(scenarios.map(scenario => scenario.key)).size, expectedCount);
  assert.deepEqual(
    new Set(scenarios.map(scenario => scenario.template.id)),
    new Set(QA_TEMPLATES.map(template => template.id)),
  );
  assert.deepEqual(
    new Set(scenarios.map(scenario => scenario.paper.id)),
    new Set(QA_PAPERS.map(paper => paper.id)),
  );
  assert.deepEqual(
    new Set(scenarios.map(scenario => scenario.language.id)),
    new Set(QA_LANGUAGES.map(language => language.id)),
  );

  for (const template of QA_TEMPLATES) {
    for (const paper of QA_PAPERS) {
      for (const language of QA_LANGUAGES) {
        assert.equal(
          scenarios.filter(scenario => (
            scenario.template.id === template.id
            && scenario.paper.id === paper.id
            && scenario.language.id === language.id
          )).length,
          1,
          `${template.id}:${paper.id}:${language.id}`,
        );
      }
    }
  }
});

test('each template exercises names, messages, and raster asset aspect ratios', () => {
  const scenarios = buildQaScenarios(assets);

  for (const template of QA_TEMPLATES) {
    const templateScenarios = scenarios.filter(scenario => scenario.template.id === template.id);
    assert.equal(templateScenarios.length, QA_VARIANTS.length, template.id);
    assert.deepEqual(
      new Set(templateScenarios.map(scenario => scenario.variant.id)),
      new Set(QA_VARIANTS.map(variant => variant.id)),
      template.id,
    );
    assert.ok(templateScenarios.some(scenario => scenario.names.id === 'short'), template.id);
    assert.ok(templateScenarios.some(scenario => scenario.names.id === 'long'), template.id);
    assert.ok(templateScenarios.some(scenario => scenario.messages.id === 'standard'), template.id);
    assert.ok(templateScenarios.some(scenario => scenario.messages.id === 'long'), template.id);
    assert.ok(templateScenarios.some(scenario => scenario.variant.assets === 'none'), template.id);
    assert.ok(templateScenarios.some(scenario => scenario.variant.assets === 'square'), template.id);
    assert.ok(templateScenarios.some(scenario => scenario.variant.assets === 'wide'), template.id);
    assert.ok(templateScenarios.some(scenario => scenario.variant.assets === 'tall'), template.id);
    assert.ok(templateScenarios.some(scenario => scenario.variant.assets === 'mixed'), template.id);
  }
});

test('scenario metadata and render state cannot drift apart', () => {
  for (const scenario of buildQaScenarios(assets)) {
    assert.equal(scenario.state.template, scenario.template.id);
    assert.equal(scenario.state.paperSize, scenario.paper.id);
    assert.equal(scenario.state.languageMode, scenario.language.id);
    assert.ok(Number.isFinite(scenario.state.nameFontSize));
    assert.match(scenario.names.ar, /[\u0600-\u06ff]/u);
    assert.match(scenario.messages.ar, /[\u0600-\u06ff]/u);

    for (const key of ['logo', 'teacherSig', 'principalSig']) {
      assert.ok(
        scenario.state[key] === null || scenario.state[key].startsWith('data:image/png;base64,'),
        `${scenario.key}:${key}`,
      );
    }

    if (scenario.language.id === 'ar') assert.equal(scenario.state.studentNameEn, '');
    if (scenario.language.id === 'en') assert.equal(scenario.state.studentNameAr, '');
    if (scenario.language.id === 'both') {
      assert.notEqual(scenario.state.studentNameAr, '');
      assert.notEqual(scenario.state.studentNameEn, '');
    }
  }
});
