# zxing-wasm 3.1.3 (vendored)

Files copied unchanged from the npm package [`zxing-wasm@3.1.3`](https://www.npmjs.com/package/zxing-wasm) (MIT licence, see `LICENSE`):

- `index.js` ← `dist/iife/full/index.js` (defines `window.ZXingWASM`)
- `zxing_full.wasm` ← `dist/full/zxing_full.wasm` (ZXing-C++ reader and writer compiled to WebAssembly)

Used by `index.html` for camera / photo barcode reading (when the browser has no `BarcodeDetector`) and for drawing barcode labels.
If these files are missing, the app downloads the same version from jsDelivr.
