# ML — status: not built

The original design had a separate Python (Flask/FastAPI) service for trained
disease-prediction and risk models. It was **dropped from scope** in the
Post-Phase-7 audit (`backend/plan.md`). A second deployable was not worth it
for this project, and everything it was meant to do now runs inside the
Node backend:

| Planned ML piece | Where it lives now |
|---|---|
| Disease prediction | `POST /api/ai/symptom-check`: symptom overlap scoring against the `Disease` catalog |
| Report analysis | `utils/reportParser.js` (pdf-parse + tesseract.js OCR) and `utils/labRanges.js` (28 parameters, sex-aware ranges) |
| Risk model | `utils/riskCalculator.js`: weighted risk score over the extracted panel |
| Conversational answers | `utils/aiEngine.js`: catalog-grounded rules engine, optionally overlaid by Gemini |

## Original sketch (kept for reference)

```
ml/                       # Machine Learning
   ├── models/
   │   ├── disease_model.pkl
   │   └── risk_model.pkl
   │
   ├── notebooks/
   │   ├── disease_prediction.ipynb
   │   └── report_analysis.ipynb
   │
   ├── api/
   │   └── predict.py        # Flask/FastAPI ML service
   │
   └── requirements.txt
```

If this is revisited, `reportParser.js` would POST the extracted findings to the
service and merge its output, keeping the in-process engine as the fallback.
