import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import '../src/App.css';
import './visual-check.css';
import Certificate from '../components/Certificate.jsx';
import { getDefaultState } from '../src/context/data.js';
import logo from '../src/assets/image.png';

const templates = ['editorial', 'geometric', 'minimal'];
const languages = [
  ['ar', 'Arabic only'],
  ['en', 'English only'],
  ['both', 'Arabic + English'],
];
const nameCases = [
  {
    id: 'short',
    label: 'Short name',
    studentNameAr: 'ليان علي',
    studentNameEn: 'Lian Ali',
  },
  {
    id: 'long',
    label: 'Very long name',
    studentNameAr: 'عبدالله محمود عادل موسى محمد عبدالعزيز الطويل',
    studentNameEn: 'Abdallah Mahmoud Adel Mousa Mohamed Abdelaziz Altawil',
  },
];

function makeState(template, languageMode, names) {
  return {
    ...getDefaultState(),
    template,
    languageMode,
    logo,
    subject: 'science',
    behavior: 'creativity',
    studentNameAr: names.studentNameAr,
    studentNameEn: names.studentNameEn,
    customMessage: languageMode === 'en'
      ? 'In recognition of excellent progress, confident participation, and consistent effort.'
      : 'بكل فخر واعتزاز، تمنح هذه الشهادة تقديراً للتميز والمشاركة الفعالة والجهد المستمر.',
  };
}

function App() {
  const scenarios = templates.flatMap(template =>
    languages.flatMap(([languageMode, languageLabel]) =>
      nameCases.map(names => ({
        key: `${template}-${languageMode}-${names.id}`,
        template,
        languageMode,
        languageLabel,
        names,
        state: makeState(template, languageMode, names),
      }))
    )
  );

  return (
    <main className="qa-page">
      <h1 className="qa-title">Certificate Studio Visual QA</h1>
      <div className="qa-grid">
        {scenarios.map(scenario => (
          <section className="qa-card" key={scenario.key}>
            <div className="qa-caption">
              <strong>{scenario.template}</strong>
              <span>{scenario.languageLabel}</span>
              <span>{scenario.names.label}</span>
            </div>
            <div className="cert">
              <Certificate state={scenario.state} />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
