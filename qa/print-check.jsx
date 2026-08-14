import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import '../src/App.css';
import './print-check.css';
import Certificate from '../components/Certificate.jsx';
import {
  QA_LANGUAGES,
  QA_PAPERS,
  buildQaScenarios,
  createQaAssets,
  markQaReady,
} from './certificate-scenarios.js';

const query = new URLSearchParams(window.location.search);
const requestedPaper = query.get('paper');
const requestedLanguage = query.get('language');
const knownPaper = QA_PAPERS.some(paper => paper.id === requestedPaper);
const knownLanguage = QA_LANGUAGES.some(language => language.id === requestedLanguage);
const scenarios = buildQaScenarios(createQaAssets()).filter(scenario => (
  (!knownPaper || scenario.paper.id === requestedPaper)
  && (!knownLanguage || scenario.language.id === requestedLanguage)
));

function App() {
  return (
    <>
      {scenarios.map((scenario, index) => (
        <section
          className={`print-page print-page--${scenario.paper.id}`}
          key={scenario.key}
          data-qa-scenario={scenario.key}
          data-template-id={scenario.template.id}
          data-paper-size={scenario.paper.id}
          data-language-mode={scenario.language.id}
          data-variant={scenario.variant.id}
          style={{
            '--qa-page-width': `${scenario.paper.width}mm`,
            '--qa-page-height': `${scenario.paper.height}mm`,
          }}
        >
          <div className="print-qa-caption">
            {index + 1}/{scenarios.length} · {scenario.template.labelEn} · {scenario.paper.label} · {scenario.language.label} · {scenario.variant.id}
          </div>
          <div className="cert">
            <Certificate state={scenario.state} mode="print" />
          </div>
        </section>
      ))}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
markQaReady(scenarios.length);
