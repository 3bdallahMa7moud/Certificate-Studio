import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import '../src/App.css';
import './visual-check.css';
import Certificate from '../components/Certificate.jsx';
import {
  buildQaScenarios,
  createQaAssets,
  markQaReady,
} from './certificate-scenarios.js';

const scenarios = buildQaScenarios(createQaAssets());

function App() {
  return (
    <main className="qa-page">
      <h1 className="qa-title">Certificate Studio Visual QA</h1>
      <p className="qa-summary">
        {scenarios.length} scenarios · 12 templates · A4 + Letter · Arabic + English + bilingual
      </p>
      <div className="qa-grid">
        {scenarios.map(scenario => (
          <section
            className="qa-card"
            key={scenario.key}
            data-qa-scenario={scenario.key}
            data-template-id={scenario.template.id}
            data-paper-size={scenario.paper.id}
            data-language-mode={scenario.language.id}
            data-variant={scenario.variant.id}
          >
            <div className="qa-caption">
              <strong>{scenario.template.labelEn}</strong>
              <span>{scenario.paper.label}</span>
              <span>{scenario.language.label}</span>
              <span>{scenario.names.label}</span>
              <span>{scenario.messages.label}</span>
              <span>{scenario.variant.assets} assets</span>
              <span>{scenario.variant.nameFontSize}% name</span>
            </div>
            <div className="cert">
              <Certificate state={scenario.state} mode="preview" />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
markQaReady(scenarios.length);
