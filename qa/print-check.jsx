import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import '../src/App.css';
import './print-check.css';
import Certificate from '../components/Certificate.jsx';
import { getDefaultState } from '../src/context/data.js';
import logo from '../src/assets/image.png';

const scenarios = [
  ['editorial', 'both', 'عبدالله محمود عادل موسى محمد عبدالعزيز الطويل', 'Abdallah Mahmoud Adel Mousa Mohamed Abdelaziz Altawil'],
  ['geometric', 'both', 'عبدالله محمود عادل موسى محمد عبدالعزيز الطويل', 'Abdallah Mahmoud Adel Mousa Mohamed Abdelaziz Altawil'],
  ['minimal', 'both', 'عبدالله محمود عادل موسى محمد عبدالعزيز الطويل', 'Abdallah Mahmoud Adel Mousa Mohamed Abdelaziz Altawil'],
  ['editorial', 'ar', 'ليان علي', ''],
  ['geometric', 'en', '', 'Lian Ali'],
  ['minimal', 'en', '', 'Lian Ali'],
];

function makeState([template, languageMode, studentNameAr, studentNameEn]) {
  return {
    ...getDefaultState(),
    template,
    languageMode,
    logo,
    subject: 'science',
    behavior: 'creativity',
    studentNameAr,
    studentNameEn,
    customMessage: languageMode === 'en'
      ? 'In recognition of excellent progress, confident participation, and consistent effort.'
      : 'بكل فخر واعتزاز، تمنح هذه الشهادة تقديراً للتميز والمشاركة الفعالة والجهد المستمر.',
  };
}

function App() {
  return (
    <>
      {scenarios.map((scenario, index) => (
        <div className="print-page" key={`${scenario[0]}-${scenario[1]}-${index}`}>
          <div className="cert">
            <Certificate state={makeState(scenario)} />
          </div>
        </div>
      ))}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
