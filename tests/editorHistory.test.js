import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HISTORY_ACTIONS,
  HISTORY_LIMIT,
  canRedo,
  canUndo,
  clearTemplateHistory,
  commitHistory,
  createHistoryState,
  editorHistoryReducer,
  redoHistory,
  undoHistory,
} from '../src/certificate-editor/historyReducer.js';

function editorialElements(x) {
  return x === 0
    ? {}
    : {
      'editorial-student-name': { x },
    };
}

function transaction(before, after, label = 'Move student name') {
  return {
    label,
    elementId: 'editorial-student-name',
    beforeElements: editorialElements(before),
    afterElements: editorialElements(after),
  };
}

test('history is independent per template and starts empty', () => {
  const history = createHistoryState();
  assert.deepEqual(Object.keys(history), [
    'editorial',
    'geometric',
    'minimal',
    'rainbow-stars',
    'jungle-friends',
    'space-explorer',
    'ocean-adventure',
    'storybook-castle',
    'sports-champion',
    'islamic-heritage',
    'graduation-honor',
    'creative-arts',
  ]);
  assert.equal(canUndo(history, 'editorial'), false);
  assert.equal(canRedo(history, 'editorial'), false);

  const editorial = commitHistory(history, 'editorial', transaction(0, 1));
  const minimal = commitHistory(editorial, 'minimal', {
    label: 'Move title',
    elementId: 'minimal-title',
    beforeElements: {},
    afterElements: {
      'minimal-title': { y: 4 },
    },
  });

  assert.equal(history.editorial.past.length, 0);
  assert.equal(minimal.editorial.past.length, 1);
  assert.equal(minimal.minimal.past.length, 1);
  assert.equal(minimal.geometric.past.length, 0);
});

test('new templates receive independent history buckets', () => {
  const history = commitHistory(
    createHistoryState(),
    'space-explorer',
    {
      label: 'Move space title',
      elementId: 'space-explorer-title',
      beforeElements: {},
      afterElements: {
        'space-explorer-title': { x: 5 },
      },
    },
  );

  assert.equal(history['space-explorer'].past.length, 1);
  assert.equal(history['rainbow-stars'].past.length, 0);
  assert.equal(history['ocean-adventure'].past.length, 0);
});

test('history retains only the latest fifty committed transactions', () => {
  let history = createHistoryState();
  for (let index = 1; index <= 55; index += 1) {
    history = commitHistory(
      history,
      'editorial',
      transaction(index - 1, index),
    );
  }

  assert.equal(history.editorial.past.length, HISTORY_LIMIT);
  assert.equal(
    history.editorial.past[0].afterElements['editorial-student-name'].x,
    6,
  );
  assert.equal(
    history.editorial.past.at(-1).afterElements['editorial-student-name'].x,
    55,
  );
});

test('undo and redo return the exact element snapshot to apply', () => {
  let history = createHistoryState();
  history = commitHistory(history, 'editorial', transaction(0, 5));
  history = commitHistory(history, 'editorial', transaction(5, 12));

  const undone = undoHistory(history, 'editorial');
  assert.deepEqual(undone.elements, editorialElements(5));
  assert.equal(undone.transaction.label, 'Move student name');
  assert.equal(undone.history.editorial.past.length, 1);
  assert.equal(undone.history.editorial.future.length, 1);
  assert.equal(canRedo(undone.history, 'editorial'), true);

  const redone = redoHistory(undone.history, 'editorial');
  assert.deepEqual(redone.elements, editorialElements(12));
  assert.equal(redone.history.editorial.past.length, 2);
  assert.equal(redone.history.editorial.future.length, 0);
});

test('a new commit after undo clears only that template redo stack', () => {
  let history = createHistoryState();
  history = commitHistory(history, 'editorial', transaction(0, 5));
  history = commitHistory(history, 'editorial', transaction(5, 10));
  history = undoHistory(history, 'editorial').history;
  history = commitHistory(history, 'minimal', {
    label: 'Move title',
    elementId: 'minimal-title',
    beforeElements: {},
    afterElements: { 'minimal-title': { y: 2 } },
  });

  assert.equal(history.editorial.future.length, 1);
  history = commitHistory(history, 'editorial', transaction(5, 7));
  assert.equal(history.editorial.future.length, 0);
  assert.equal(history.minimal.past.length, 1);
});

test('one grouped interaction creates one transaction and no-op commits are ignored', () => {
  let history = createHistoryState();
  history = commitHistory(history, 'editorial', transaction(0, 40, 'Drag'));
  assert.equal(history.editorial.past.length, 1);

  history = commitHistory(history, 'editorial', transaction(40, 40, 'No-op'));
  assert.equal(history.editorial.past.length, 1);

  history = commitHistory(history, 'unknown', transaction(40, 42));
  assert.equal(history.editorial.past.length, 1);
});

test('history sanitizes snapshots so domain data and assets cannot enter it', () => {
  const history = commitHistory(createHistoryState(), 'editorial', {
    label: 'Safe snapshot',
    elementId: 'editorial-header',
    beforeElements: {},
    afterElements: {
      'editorial-header': {
        x: 3,
        logo: 'data:image/png;base64,AAAA',
        contentOverride: {
          en: 'Certificate title',
        },
      },
      logo: {
        src: 'data:image/png;base64,AAAA',
      },
    },
  });

  const serialized = JSON.stringify(history);
  assert.equal(serialized.includes('base64'), false);
  assert.deepEqual(
    history.editorial.past[0].afterElements,
    {
      'editorial-header': {
        x: 3,
        contentOverride: {
          en: 'Certificate title',
        },
      },
    },
  );
});

test('reducer actions and template clearing preserve other histories', () => {
  let history = createHistoryState();
  history = editorHistoryReducer(history, {
    type: HISTORY_ACTIONS.COMMIT,
    templateId: 'editorial',
    transaction: transaction(0, 2),
  });
  history = editorHistoryReducer(history, {
    type: HISTORY_ACTIONS.COMMIT,
    templateId: 'minimal',
    transaction: {
      label: 'Move title',
      elementId: 'minimal-title',
      beforeElements: {},
      afterElements: { 'minimal-title': { y: 2 } },
    },
  });
  history = editorHistoryReducer(history, {
    type: HISTORY_ACTIONS.UNDO,
    templateId: 'editorial',
  });

  assert.equal(history.editorial.future.length, 1);
  assert.equal(history.minimal.past.length, 1);

  const cleared = clearTemplateHistory(history, 'editorial');
  assert.deepEqual(cleared.editorial, { past: [], future: [] });
  assert.equal(cleared.minimal.past.length, 1);

  const allCleared = editorHistoryReducer(cleared, {
    type: HISTORY_ACTIONS.CLEAR_ALL,
  });
  assert.deepEqual(allCleared, createHistoryState());
});
