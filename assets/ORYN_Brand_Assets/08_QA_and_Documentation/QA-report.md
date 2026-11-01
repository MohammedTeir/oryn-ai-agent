# ORYN Brand Assets v3.0 — QA Report

Generated 2026-11-01. All assets in this package were approved by the owner on 2026-11-01 (confirmed in chat). The technical limitations below still apply.

**Automated checks:** 250 run - 250 PASS, 0 NEEDS REVIEW, 0 FAIL.

## Deliverable status

| Deliverable | Technical | Brand status | Notes |
|---|---|---|---|
| 00_Original_Approved_Designs/** (30 files) | PASS | Approved (unchanged) | Byte-identical (SHA-256) |
| 01_Primary_Logo/*-transparent.png, *-white-bg.png | PASS | APPROVED (owner, 2026-11-01) | v2 bold-wordmark logo (GPT-generated); wordmark text extracted from image, symbol = clean v2 master; awaiting approval |
| 01_Primary_Logo/oryn-primary-logo.svg (+ @2x renders) | PASS | APPROVED (owner, 2026-11-01) | Traced approximation (stacked colour layers); wordmark outlined from raster, not original font |
| 01_Primary_Logo + 02_Secondary_Logo/*-reversed-for-dark.* (white wordmark) | PASS | APPROVED (owner, 2026-11-01) | Colour symbol + white wordmark/light tagline for dark backgrounds |
| 02_Secondary_Logo/*-transparent.png, *-white-bg.png | PASS | APPROVED (owner, 2026-11-01) | Same method and limits as primary |
| 02_Secondary_Logo/oryn-secondary-logo.svg (+ @2x renders) | PASS | APPROVED (owner, 2026-11-01) | Same as primary SVG |
| 03_Icon_Only/oryn-icon-only-transparent.png + 1024/512/256/128/64 PNG | PASS | APPROVED (owner, 2026-11-01) | Candidate v2 master (keyed from magenta bg) awaiting approval; true RGBA; symbol differs from approved v1.1 logos |
| 03_Icon_Only/oryn-icon-only.svg | PASS | APPROVED (owner, 2026-11-01) | Traced approximation of the candidate; IoU/colour error in checks below |
| 03_Icon_Only/oryn-icon-only-2048/4096-vector-render.png | PASS | APPROVED (owner, 2026-11-01) | Rendered from the traced SVG; no new detail beyond the 1276 px source |
| 04_Monochrome/** (9 PNG + 9 SVG) | PASS | APPROVED (owner, 2026-11-01) | Silhouettes: internal ribbons/glass layers merge into one shape |
| 05_Android/res (foreground, monochrome) | PASS | APPROVED (owner, 2026-11-01) | Safe-zone verified |
| 05_Android/res (background, legacy ic_launcher*, play-store, expo/icon.png) | PASS | APPROVED (owner, 2026-11-01) | Background = your generated navy/swoosh image resized to 1024 px (raster, not vector) |
| 05_Android/res/mipmap-anydpi-v26/*.xml, values/*.xml | PASS | n/a | Well-formed; not runtime-tested in an Android build |
| 06_Previews/** | PASS | n/a | Generated for review only |

## Checks that raised NEEDS REVIEW / FAIL


## Geometry consistency (silhouette IoU after bounding-box normalisation)

| Pair | IoU |
|---|---|
| icon-only candidate vs secondary logo symbol | 0.981 |
| icon-only candidate vs primary logo symbol | 0.981 |
| secondary vs primary logo symbol | 0.989 |

Symbol bounding-box aspect (w/h): icon-only 1.046, primary 1.046, secondary 1.046. All three use the same v2 master symbol; the remaining ~2 percent difference is resampling/alpha-threshold noise, so geometry is consistent. The v2 bold wordmark/tagline replaces the v1.1 lettering as approved by the owner.

## Method summary

- Background removal: saturation (chroma) segmentation, not global white/grey removal. Enclosed glass highlights were restored; a weak-chroma pass restores near-white glass pockets bounded by the symbol. Edge alpha is estimated from chroma ratio; fringe colours come from the nearest solid logo pixel.
- Text (wordmark/tagline): alpha from luminance against an estimated background, flat colour sampled from the approved lettering.
- Vectors: colour-quantised (64 Lab clusters) stacked level-set layers, Bezier-fitted contours, a clip path for the outer silhouette and a 1.2 px soft blur to hide banding. Verified by rendering the SVG in Chromium and comparing to the raster (see SVG checks). Not a geometric reconstruction and not proven equivalent to any original vector.
- Colour profile: every PNG embeds an sRGB ICC profile; SVG uses sRGB by default.

## Known limitations

1. Partial-transparency recovery is an estimate: the sources are already composited over white/grey, so edge alpha cannot be recovered exactly.
2. Symbol is keyed from a magenta background, so edges are clean; secondary/primary text was extracted from white-background images (soft edges within about 1 px).
3. SVGs are traced approximations with visible tonal steps at very high zoom; they are large (about 0.5-1 MB). A designer rebuild with true gradients/meshes would be better for print.
4. The wordmark and tagline are outlines traced from raster, so the original typeface is not available and curves may differ slightly.
5. 2048/4096 PNGs are rendered from the traced SVG, not AI-upscaled; no new fine detail exists beyond the sources (1276 px icon, 2172x724 primary, 1199x1312 secondary).
6. Monochrome versions are silhouettes: the internal ribbon/glass layering is not represented.
7. Android background is your generated image resized to 1024 px (raster); the larger background sizes are upscaled from it. Resources were not test-built in your Expo project.
8. "Correct colour profiles" is verified as sRGB embedded/assumed, not as a calibrated print workflow.

## Full check log

Machine-readable: `qa-checks.json` (250 checks).
