### 🎬 **Context prompt — Web After Effects Simplified**

Obiettivo: sviluppare un editor di animazioni web 2D/3D ispirato a After Effects, con interfaccia semplice ma strutturata, che permetta di animare testi, forme e immagini, e di esportare video MP4.

#### Stack e scelte tecniche

- **Framework UI:** Svelte 5 (usare _runes_, no state manager esterni).
- **Rendering:** Three.js (supporto 2D + 3D nel canvas principale).
- **Export video:** ffmpeg.wasm per generare MP4 direttamente nel browser.
- **Runtime:** totalmente client-side, no backend obbligatorio.

#### Funzionalità principali

1. **Timeline con keyframe**
   - Gestione livelli (layers).
   - Interpolazione automatica (linear, ease-in/out, cubic-bezier).
   - Playhead, scrubbing e anteprima real-time.

2. **Canvas editor (viewport)**
   - Zoom/pan, snap, griglie, guide.
   - Selezione, drag, resize, rotazione.
   - Anteprima animazione sincronizzata con la timeline.

3. **Gestione oggetti**
   - Tipi: testo, forma vettoriale, immagine.
   - Proprietà animabili: posizione, scala, rotazione, opacità, colore.
   - Layer ordinabili, visibili/nascosti, bloccabili.

4. **Animazioni**
   - Motion paths semplici.
   - Curve di easing personalizzabili.
   - Preset base (fade, slide, bounce).

5. **Salvataggio e export**
   - Salvataggio progetto in JSON (scene, timeline, keyframes).
   - Esportazione video in MP4 via ffmpeg.wasm.
   - (Futuro) Esportazione in Lottie o WebM.

6. **Interfaccia**
   - Layout a pannelli: timeline, canvas, proprietà, layer list.
   - UI reattiva e fluida, orientata alla semplicità.
   - Tutto gestito con logica reattiva di Svelte (runes).

#### Obiettivo MVP

Creare un **prototipo funzionante** che permetta:

- Creazione di oggetti su canvas (es. testo o forma).
- Aggiunta di keyframe su posizione e opacità.
- Riproduzione e anteprima animazione.
- Esportazione in MP4.
