import { useEffect, useState } from 'react';

import type { KeyboardEvent } from 'react';
import type { PluginContext } from './types';

// DESIGN INTENT (filled from spec.custom.description):
// Build an interactive length-unit conversion exercise for grade 7. The student sees a horizontal animated ruler that zooms between four scales (mm, cm, m, km). Tick-mark density and spacing animate with CSS transitions when the student picks a unit button — the effect should feel like pinching/zooming the measurement space. Each of six rounds presents a measurement in one unit (highlighted on the ruler) and asks the student to enter the equivalent in a different target unit shown in the prompt. Rounds: 3 km → m (3000), 250 cm → m (2.5), 1.5 m → cm (150), 45 mm → cm (4.5), 5000 m → km (5), 3200 mm → m (3.2). UI: unit-scale toggle buttons, numeric input, Check button, round counter (e.g. 2/6). On correct answer: green highlight pulse and advance; on wrong: shake input and allow retry. Prefix every CSS class with pl-g7-physics-length- (e.g. const c = (n) => 'pl-g7-physics-length-' + n). Do not import from @/. Call context.reportProgress({ score: correctCount/6, completed: correctCount===6 }) after each correct answer. Keep bundle small — React and scoped CSS only, no extra npm deps.

const PREFIX = 'pl-g7-physics-length-';
const c = (name: string): string => PREFIX + name;

const ROUND_COUNT = 6;

type Unit = 'mm' | 'cm' | 'm' | 'km';

type Round = {
  given: number;
  fromUnit: Unit;
  toUnit: Unit;
  answer: number;
};

type Feedback = 'idle' | 'correct' | 'wrong';

const UNIT_TO_MM: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  km: 1_000_000
};

const UNITS: Unit[] = ['mm', 'cm', 'm', 'km'];

const ROUNDS: Round[] = [
  { given: 3, fromUnit: 'km', toUnit: 'm', answer: 3000 },
  { given: 250, fromUnit: 'cm', toUnit: 'm', answer: 2.5 },
  { given: 1.5, fromUnit: 'm', toUnit: 'cm', answer: 150 },
  { given: 45, fromUnit: 'mm', toUnit: 'cm', answer: 4.5 },
  { given: 5000, fromUnit: 'm', toUnit: 'km', answer: 5 },
  { given: 3200, fromUnit: 'mm', toUnit: 'm', answer: 3.2 }
];

type Tick = {
  posPct: number;
  major: boolean;
  label: string | null;
};

function toMm(value: number, unit: Unit): number {
  return value * UNIT_TO_MM[unit];
}

function niceViewMaxMm(givenMm: number): number {
  if (givenMm <= 0) return 100;

  const padded = givenMm * 1.2;
  const magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
  const normalized = padded / magnitude;

  let nice: number;

  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;

  return nice * magnitude;
}

function pickTickStep(maxInUnit: number): number {
  const candidates = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

  for (const step of candidates) {
    const count = maxInUnit / step;

    if (count >= 4 && count <= 12) return step;
  }

  return Math.max(maxInUnit / 8, 0.1);
}

function formatUnitValue(value: number): string {
  if (Number.isInteger(value)) return String(value);

  return String(parseFloat(value.toFixed(4)));
}

function buildTicks(viewMaxMm: number, unit: Unit): Tick[] {
  const unitMm = UNIT_TO_MM[unit];
  const maxInUnit = viewMaxMm / unitMm;
  const step = pickTickStep(maxInUnit);
  const labelEvery = step * 5 <= maxInUnit ? step * 5 : step;
  const ticks: Tick[] = [];

  for (let value = 0; value <= maxInUnit + step * 0.001; value += step) {
    const posPct = (value * unitMm * 100) / viewMaxMm;
    const isMajor = Math.abs(value % labelEvery) < step * 0.001 || value === 0;
    const label = isMajor ? formatUnitValue(value) : null;

    ticks.push({ posPct, major: isMajor, label });
  }

  return ticks;
}

function answersMatch(userText: string, correct: number): boolean {
  const user = Number.parseFloat(userText.trim());

  if (!Number.isFinite(user)) return false;

  const tolerance = Math.max(0.001, Math.abs(correct) * 0.001);

  return Math.abs(user - correct) <= tolerance;
}

type Props = {
  context: PluginContext;
};

export default function Exercise({ context }: Props) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [viewUnit, setViewUnit] = useState<Unit>(ROUNDS[0].fromUnit);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [zoomKey, setZoomKey] = useState(0);

  const round = ROUNDS[roundIndex];
  const givenMm = toMm(round.given, round.fromUnit);
  const viewMaxMm = niceViewMaxMm(givenMm);
  const highlightPct = (givenMm * 100) / viewMaxMm;
  const ticks = buildTicks(viewMaxMm, viewUnit);
  const allDone = correctCount === ROUND_COUNT;

  useEffect(() => {
    context.reportProgress({
      score: correctCount / ROUND_COUNT,
      completed: correctCount === ROUND_COUNT
    });
  }, [correctCount, context]);

  function handleUnitChange(unit: Unit) {
    if (unit === viewUnit) return;

    setViewUnit(unit);
    setZoomKey((key) => key + 1);
  }

  function handleCheck() {
    if (allDone || feedback === 'correct') return;

    if (answersMatch(inputValue, round.answer)) {
      const nextCorrect = correctCount + 1;
      setFeedback('correct');
      setCorrectCount(nextCorrect);

      window.setTimeout(() => {
        if (nextCorrect < ROUND_COUNT) {
          const nextIndex = roundIndex + 1;
          setRoundIndex(nextIndex);
          setViewUnit(ROUNDS[nextIndex].fromUnit);
          setInputValue('');
          setFeedback('idle');
          setZoomKey((key) => key + 1);
        }
      }, 900);

      return;
    }

    setFeedback('wrong');
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') handleCheck();
  }

  const inputClassName =
    feedback === 'wrong'
      ? `${c('input')} ${c('input-shake')}`
      : feedback === 'correct'
        ? `${c('input')} ${c('input-correct')}`
        : c('input');

  const highlightClassName =
    feedback === 'correct'
      ? `${c('highlight')} ${c('highlight-correct')} ${c('highlight-pulse')}`
      : `${c('highlight')} ${c('highlight-given')}`;

  return (
    <div className={c('root')}>
      <header className={c('header')}>
        <h2 className={c('title')}>Zooming Ruler: Unit Converter</h2>

        <p className={c('round-counter')} aria-live="polite">
          Round {Math.min(roundIndex + 1, ROUND_COUNT)} / {ROUND_COUNT}
        </p>
      </header>

      <p className={c('prompt')}>
        Convert{' '}
        <strong>
          {formatUnitValue(round.given)} {round.fromUnit}
        </strong>{' '}
        to <strong>{round.toUnit}</strong>.
      </p>

      <div className={c('unit-bar')} role="group" aria-label="Ruler scale">
        {UNITS.map((unit) => (
          <button
            key={unit}
            type="button"
            className={
              viewUnit === unit
                ? `${c('unit-button')} ${c('unit-button-active')}`
                : c('unit-button')
            }
            onClick={() => handleUnitChange(unit)}
            aria-pressed={viewUnit === unit}
          >
            {unit}
          </button>
        ))}
      </div>

      <div className={c('ruler-wrap')} aria-hidden={allDone}>
        <div className={c('ruler-viewport')}>
          <div key={zoomKey} className={c('ruler-track')}>
            <div className={c('ruler-baseline')} />

            {ticks.map((tick, index) => (
              <div
                key={`${viewUnit}-${index}`}
                className={
                  tick.major ? `${c('tick')} ${c('tick-major')}` : c('tick')
                }
                style={{ left: `${tick.posPct}%` }}
              >
                {tick.label !== null && (
                  <span className={c('tick-label')}>{tick.label}</span>
                )}
              </div>
            ))}

            <div
              className={highlightClassName}
              style={{ width: `${highlightPct}%` }}
            />

            <div
              className={c('given-marker')}
              style={{ left: `${highlightPct}%` }}
            />
          </div>
        </div>

        <p className={c('ruler-caption')}>
          Highlighted distance: {formatUnitValue(round.given)} {round.fromUnit}
        </p>
      </div>

      {!allDone && (
        <div className={c('answer-row')}>
          <label className={c('answer-label')} htmlFor={c('answer-input')}>
            Your answer ({round.toUnit})
          </label>

          <div className={c('answer-controls')}>
            <input
              id={c('answer-input')}
              className={inputClassName}
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value);
                if (feedback === 'wrong') setFeedback('idle');
              }}
              onKeyDown={handleInputKeyDown}
              disabled={feedback === 'correct'}
              aria-invalid={feedback === 'wrong'}
            />

            <button
              type="button"
              className={c('check-button')}
              onClick={handleCheck}
              disabled={feedback === 'correct' || inputValue.trim() === ''}
            >
              Check answer
            </button>
          </div>

          {feedback === 'wrong' && (
            <p className={c('feedback-wrong')} role="alert">
              Not quite — try again.
            </p>
          )}
        </div>
      )}

      {allDone && (
        <div className={c('banner')} role="status">
          All six conversions correct — you can switch ruler scales to see how the
          same distance looks in mm, cm, m, and km.
        </div>
      )}
    </div>
  );
}
