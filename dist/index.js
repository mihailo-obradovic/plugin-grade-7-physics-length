import { createRoot } from 'react-dom/client';
import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

// src/index.tsx

// src/i18n/messages/en.json
var en_default = {
  title: "Zooming Ruler: Unit Converter",
  roundCounter: "Round {current} / {total}",
  convertPrompt: "Convert {given} {fromUnit} to {toUnit}.",
  rulerCaption: "Highlighted distance: {value} {unit}",
  answerLabel: "Your answer ({unit})",
  checkButton: "Check answer",
  feedbackWrong: "Not quite \u2014 try again.",
  completion: "All six conversions correct \u2014 you can switch ruler scales to see how the same distance looks in mm, cm, m, and km.",
  rulerScaleAria: "Ruler scale"
};

// src/i18n/messages/sr-cyrl.json
var sr_cyrl_default = {
  title: "\u0423\u0432\u0435\u045B\u0430\u0432\u0430\u0458\u0443\u045B\u0430 \u0440\u0430\u0432\u045A\u0430: \u043F\u0440\u0435\u0442\u0432\u0430\u0440\u0430\u0447 \u0458\u0435\u0434\u0438\u043D\u0438\u0446\u0430",
  roundCounter: "\u0420\u0443\u043D\u0434\u0430 {current} / {total}",
  convertPrompt: "\u041F\u0440\u0435\u0442\u0432\u043E\u0440\u0438 {given} {fromUnit} \u0443 {toUnit}.",
  rulerCaption: "\u041E\u0437\u043D\u0430\u0447\u0435\u043D\u0430 \u0443\u0434\u0430\u0459\u0435\u043D\u043E\u0441\u0442: {value} {unit}",
  answerLabel: "\u0422\u0432\u043E\u0458 \u043E\u0434\u0433\u043E\u0432\u043E\u0440 ({unit})",
  checkButton: "\u041F\u0440\u043E\u0432\u0458\u0435\u0440\u0438 \u043E\u0434\u0433\u043E\u0432\u043E\u0440",
  feedbackWrong: "\u041D\u0438\u0458\u0435 \u0431\u0430\u0448 \u0442\u0430\u0447\u043D\u043E \u2014 \u043F\u043E\u043A\u0443\u0448\u0430\u0458 \u043F\u043E\u043D\u043E\u0432\u043E.",
  completion: "\u0421\u0432\u0438\u0445 \u0448\u0435\u0441\u0442 \u043F\u0440\u0435\u0442\u0432\u0430\u0440\u0430\u045A\u0430 \u0458\u0435 \u0442\u0430\u0447\u043D\u043E \u2014 \u043C\u043E\u0436\u0435\u0448 \u043C\u0438\u0458\u0435\u045A\u0430\u0442\u0438 \u0441\u043A\u0430\u043B\u0443 \u0440\u0430\u0432\u045A\u0435 \u0434\u0430 \u0432\u0438\u0434\u0438\u0448 \u043A\u0430\u043A\u043E \u0438\u0441\u0442\u0430 \u0443\u0434\u0430\u0459\u0435\u043D\u043E\u0441\u0442 \u0438\u0437\u0433\u043B\u0435\u0434\u0430 \u0443 mm, cm, m \u0438 km.",
  rulerScaleAria: "\u0421\u043A\u0430\u043B\u0430 \u0440\u0430\u0432\u045A\u0435"
};

// src/i18n/messages/sr-latn.json
var sr_latn_default = {
  title: "Uve\u0107avaju\u0107a ravnja: pretvara\u010D jedinica",
  roundCounter: "Runda {current} / {total}",
  convertPrompt: "Pretvori {given} {fromUnit} u {toUnit}.",
  rulerCaption: "Ozna\u010Dena udaljenost: {value} {unit}",
  answerLabel: "Tvoj odgovor ({unit})",
  checkButton: "Provjeri odgovor",
  feedbackWrong: "Nije ba\u0161 ta\u010Dno \u2014 poku\u0161aj ponovo.",
  completion: "Svih \u0161est pretvaranja je ta\u010Dno \u2014 mo\u017Ee\u0161 mijenjati skalu ravnje da vidi\u0161 kako ista udaljenost izgleda u mm, cm, m i km.",
  rulerScaleAria: "Skala ravnje"
};

// src/i18n/messages.ts
var pluginMessages = {
  en: en_default,
  "sr-latn": sr_latn_default,
  "sr-cyrl": sr_cyrl_default
};

// src/i18n/usePluginTranslations.ts
function formatMessage(template, values) {
  if (!values) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = values[key];
    return value === void 0 ? `{${key}}` : String(value);
  });
}
function usePluginLocale(i18n) {
  return useSyncExternalStore(i18n.subscribe, i18n.getLocale, i18n.getLocale);
}
function usePluginTranslations(i18n) {
  const locale = usePluginLocale(i18n);
  const catalog = pluginMessages[locale];
  return useCallback(
    (key, values) => formatMessage(catalog[key], values),
    [catalog]
  );
}
var PREFIX = "pl-g7-physics-length-";
var c = (name) => PREFIX + name;
var ROUND_COUNT = 6;
var UNIT_TO_MM = {
  mm: 1,
  cm: 10,
  m: 1e3,
  km: 1e6
};
var UNITS = ["mm", "cm", "m", "km"];
var ROUNDS = [
  { given: 3, fromUnit: "km", toUnit: "m", answer: 3e3 },
  { given: 250, fromUnit: "cm", toUnit: "m", answer: 2.5 },
  { given: 1.5, fromUnit: "m", toUnit: "cm", answer: 150 },
  { given: 45, fromUnit: "mm", toUnit: "cm", answer: 4.5 },
  { given: 5e3, fromUnit: "m", toUnit: "km", answer: 5 },
  { given: 3200, fromUnit: "mm", toUnit: "m", answer: 3.2 }
];
function toMm(value, unit) {
  return value * UNIT_TO_MM[unit];
}
function niceViewMaxMm(givenMm) {
  if (givenMm <= 0) return 100;
  const padded = givenMm * 1.2;
  const magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
  const normalized = padded / magnitude;
  let nice;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}
function pickTickStep(maxInUnit) {
  const candidates = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1e3];
  for (const step of candidates) {
    const count = maxInUnit / step;
    if (count >= 4 && count <= 12) return step;
  }
  return Math.max(maxInUnit / 8, 0.1);
}
function formatUnitValue(value) {
  if (Number.isInteger(value)) return String(value);
  return String(parseFloat(value.toFixed(4)));
}
function buildTicks(viewMaxMm, unit) {
  const unitMm = UNIT_TO_MM[unit];
  const maxInUnit = viewMaxMm / unitMm;
  const step = pickTickStep(maxInUnit);
  const labelEvery = step * 5 <= maxInUnit ? step * 5 : step;
  const ticks = [];
  for (let value = 0; value <= maxInUnit + step * 1e-3; value += step) {
    const posPct = value * unitMm * 100 / viewMaxMm;
    const isMajor = Math.abs(value % labelEvery) < step * 1e-3 || value === 0;
    const label = isMajor ? formatUnitValue(value) : null;
    ticks.push({ posPct, major: isMajor, label });
  }
  return ticks;
}
function answersMatch(userText, correct) {
  const user = Number.parseFloat(userText.trim());
  if (!Number.isFinite(user)) return false;
  const tolerance = Math.max(1e-3, Math.abs(correct) * 1e-3);
  return Math.abs(user - correct) <= tolerance;
}
function Exercise({ context }) {
  const t = usePluginTranslations(context.i18n);
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [viewUnit, setViewUnit] = useState(ROUNDS[0].fromUnit);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState("idle");
  const [zoomKey, setZoomKey] = useState(0);
  const round = ROUNDS[roundIndex];
  const givenMm = toMm(round.given, round.fromUnit);
  const viewMaxMm = niceViewMaxMm(givenMm);
  const highlightPct = givenMm * 100 / viewMaxMm;
  const ticks = buildTicks(viewMaxMm, viewUnit);
  const allDone = correctCount === ROUND_COUNT;
  useEffect(() => {
    context.reportProgress({
      score: correctCount / ROUND_COUNT,
      completed: correctCount === ROUND_COUNT
    });
  }, [correctCount, context]);
  function handleUnitChange(unit) {
    if (unit === viewUnit) return;
    setViewUnit(unit);
    setZoomKey((key) => key + 1);
  }
  function handleCheck() {
    if (allDone || feedback === "correct") return;
    if (answersMatch(inputValue, round.answer)) {
      const nextCorrect = correctCount + 1;
      setFeedback("correct");
      setCorrectCount(nextCorrect);
      window.setTimeout(() => {
        if (nextCorrect < ROUND_COUNT) {
          const nextIndex = roundIndex + 1;
          setRoundIndex(nextIndex);
          setViewUnit(ROUNDS[nextIndex].fromUnit);
          setInputValue("");
          setFeedback("idle");
          setZoomKey((key) => key + 1);
        }
      }, 900);
      return;
    }
    setFeedback("wrong");
  }
  function handleInputKeyDown(event) {
    if (event.key === "Enter") handleCheck();
  }
  const inputClassName = feedback === "wrong" ? `${c("input")} ${c("input-shake")}` : feedback === "correct" ? `${c("input")} ${c("input-correct")}` : c("input");
  const highlightClassName = feedback === "correct" ? `${c("highlight")} ${c("highlight-correct")} ${c("highlight-pulse")}` : `${c("highlight")} ${c("highlight-given")}`;
  return /* @__PURE__ */ jsxs("div", { className: c("root"), children: [
    /* @__PURE__ */ jsxs("header", { className: c("header"), children: [
      /* @__PURE__ */ jsx("h2", { className: c("title"), children: t("title") }),
      /* @__PURE__ */ jsx("p", { className: c("round-counter"), "aria-live": "polite", children: t("roundCounter", {
        current: Math.min(roundIndex + 1, ROUND_COUNT),
        total: ROUND_COUNT
      }) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: c("prompt"), children: t("convertPrompt", {
      given: formatUnitValue(round.given),
      fromUnit: round.fromUnit,
      toUnit: round.toUnit
    }) }),
    /* @__PURE__ */ jsx("div", { className: c("unit-bar"), role: "group", "aria-label": t("rulerScaleAria"), children: UNITS.map((unit) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: viewUnit === unit ? `${c("unit-button")} ${c("unit-button-active")}` : c("unit-button"),
        onClick: () => handleUnitChange(unit),
        "aria-pressed": viewUnit === unit,
        children: unit
      },
      unit
    )) }),
    /* @__PURE__ */ jsxs("div", { className: c("ruler-wrap"), "aria-hidden": allDone, children: [
      /* @__PURE__ */ jsx("div", { className: c("ruler-viewport"), children: /* @__PURE__ */ jsxs("div", { className: c("ruler-track"), children: [
        /* @__PURE__ */ jsx("div", { className: c("ruler-baseline") }),
        ticks.map((tick, index) => /* @__PURE__ */ jsx(
          "div",
          {
            className: tick.major ? `${c("tick")} ${c("tick-major")}` : c("tick"),
            style: { left: `${tick.posPct}%` },
            children: tick.label !== null && /* @__PURE__ */ jsx("span", { className: c("tick-label"), children: tick.label })
          },
          `${viewUnit}-${index}`
        )),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: highlightClassName,
            style: { width: `${highlightPct}%` }
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: c("given-marker"),
            style: { left: `${highlightPct}%` }
          }
        )
      ] }, zoomKey) }),
      /* @__PURE__ */ jsx("p", { className: c("ruler-caption"), children: t("rulerCaption", {
        value: formatUnitValue(round.given),
        unit: round.fromUnit
      }) })
    ] }),
    !allDone && /* @__PURE__ */ jsxs("div", { className: c("answer-row"), children: [
      /* @__PURE__ */ jsx("label", { className: c("answer-label"), htmlFor: c("answer-input"), children: t("answerLabel", { unit: round.toUnit }) }),
      /* @__PURE__ */ jsxs("div", { className: c("answer-controls"), children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            id: c("answer-input"),
            className: inputClassName,
            type: "text",
            inputMode: "decimal",
            value: inputValue,
            onChange: (event) => {
              setInputValue(event.target.value);
              if (feedback === "wrong") setFeedback("idle");
            },
            onKeyDown: handleInputKeyDown,
            disabled: feedback === "correct",
            "aria-invalid": feedback === "wrong"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: c("check-button"),
            onClick: handleCheck,
            disabled: feedback === "correct" || inputValue.trim() === "",
            children: t("checkButton")
          }
        )
      ] }),
      feedback === "wrong" && /* @__PURE__ */ jsx("p", { className: c("feedback-wrong"), role: "alert", children: t("feedbackWrong") })
    ] }),
    allDone && /* @__PURE__ */ jsx("div", { className: c("banner"), role: "status", children: t("completion") })
  ] });
}
var roots = /* @__PURE__ */ new WeakMap();
function mount(root, context) {
  const reactRoot = createRoot(root);
  roots.set(root, reactRoot);
  reactRoot.render(/* @__PURE__ */ jsx(Exercise, { context }));
  return () => {
    reactRoot.unmount();
    roots.delete(root);
  };
}

export { mount };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map