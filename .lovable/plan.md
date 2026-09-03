# Payment PDF: QR and single-page A4 fix

## Scope

Modify only `src/lib/payment-pdf.ts`. Preserve the QR payload, payment data, translations, subscription flow, error toast, and all unrelated application behavior.

## Implementation

1. **Export a real QR image before capture**
   - Normalize the supplied QR into a dedicated PNG image before `html2canvas` runs.
   - If a QR canvas exists, export it with `canvas.toDataURL("image/png")`; otherwise validate and reuse the existing QR data URL without changing its payload.
   - Reject empty/blank exports, create an `<img>` with explicit dimensions, and await its load inside the PDF document.
   - Log `[payment-pdf] QR converted successfully` only after the image is measurable and contains non-empty image data.

2. **Build an exact A4-sized document**
   - Make the PDF root exactly `794px × 1123px`, with `box-sizing: border-box` and `overflow: hidden`.
   - Use a column layout that keeps header, payment details + QR, steps, notes, signature/stamp, and footer within that fixed height.
   - Tighten only spacing, gaps, type sizes, and QR size as needed; retain every existing information block and visual element.
   - Keep the footer anchored in normal flex layout at the bottom, not through negative positioning.

3. **Measure and fit before rendering**
   - Log actual DOM width/height and expected dimensions.
   - If content exceeds 1123px, apply bounded compact layout levels that proportionally reduce vertical spacing and typography, remeasure after each level, and fail rather than crop if it still cannot fit.
   - Log `[payment-pdf] DOM fits A4` only after `scrollHeight <= 1123`.

4. **Render exactly one page**
   - Await document fonts and all logo, watermark, and QR images.
   - Capture at exactly `794 × 1123` with the requested `html2canvas` options and `scale: 2`.
   - Export PNG and add it once to a portrait A4 jsPDF at `0, 0, 210, 297`; remove all pagination and `addPage()` logic.
   - Preserve RTL Arabic shaping and LTR French/English, with isolated LTR handling for numbers, CCP, references, URLs, and phone-like values.
   - Emit the requested success logs and one `[payment-pdf] FAILED:` error path so the existing caller continues showing its current error toast.

## Verification

- Run the project’s automated type/build checks after the one-file edit.
- Generate actual Arabic, French, and English downloads in Chromium using the live payment page.
- Inspect each downloaded PDF at desktop and mobile viewport sizes and verify: one page; visible/scannable QR; logo and watermark; complete payment details; steps and notes; signature and stamp; footer; no clipping; Arabic RTL; French/English LTR.
- Inspect rendered PDF pages visually and verify the QR decodes to the same supplied payment payload before reporting completion.
