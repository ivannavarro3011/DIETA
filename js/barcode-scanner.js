// Escáner de códigos de barras con la cámara trasera. Usa el BarcodeDetector nativo
// (Android/Chrome) y, donde no existe (iPhone), la librería ZXing cargada bajo demanda.

const ZXING_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.23.0/umd/index.min.js';
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
const CAMERA = { video: { facingMode: { ideal: 'environment' } }, audio: false };

let zxingPromise = null;

function loadZxing() {
  if (window.ZXing) return Promise.resolve(window.ZXing);
  if (!zxingPromise) {
    zxingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = ZXING_URL;
      script.onload = () => resolve(window.ZXing);
      script.onerror = () => { zxingPromise = null; reject(new Error('zxing')); };
      document.head.appendChild(script);
    });
  }
  return zxingPromise;
}

async function nativeDetectorAvailable() {
  if (!('BarcodeDetector' in window)) return false;
  try {
    const supported = await window.BarcodeDetector.getSupportedFormats();
    return FORMATS.some((f) => supported.includes(f));
  } catch {
    return false;
  }
}

// Arranca la cámara en videoEl; llama a onCode(código) una vez o a onError(error).
// Devuelve stop() al instante, para poder cancelar incluso mientras la cámara arranca.
export function startScanner(videoEl, onCode, onError) {
  let stopped = false;
  const cleanups = [];
  const stop = () => {
    stopped = true;
    while (cleanups.length) cleanups.pop()();
  };
  const found = (code) => {
    if (stopped || !code) return;
    stop();
    onCode(code);
  };

  (async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-camera');
    if (await nativeDetectorAvailable()) {
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA);
      cleanups.push(() => { stream.getTracks().forEach((t) => t.stop()); videoEl.srcObject = null; });
      if (stopped) return stop();
      videoEl.srcObject = stream;
      await videoEl.play();
      const detector = new window.BarcodeDetector({ formats: FORMATS });
      let timer = null;
      cleanups.push(() => clearTimeout(timer));
      const tick = async () => {
        if (stopped) return;
        try {
          const codes = await detector.detect(videoEl);
          if (codes.length) return found(codes[0].rawValue);
        } catch { /* fotograma aún no listo */ }
        timer = setTimeout(tick, 250);
      };
      tick();
    } else {
      const ZXing = await loadZxing();
      if (stopped) return;
      const hints = new Map([[ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E,
      ]]]);
      const reader = new ZXing.BrowserMultiFormatReader(hints);
      cleanups.push(() => reader.reset());
      await reader.decodeFromConstraints(CAMERA, videoEl, (result) => {
        if (result) found(result.getText());
      });
      if (stopped) reader.reset();
    }
  })().catch((err) => {
    if (stopped) return;
    stop();
    onError(err);
  });

  return stop;
}
