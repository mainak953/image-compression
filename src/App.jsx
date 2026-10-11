import { useState } from 'react'
import './App.css'
import { rleEncode } from './rle'
function App() {
  const [image, setImage] = useState(null)
  const [slider, setSlider] = useState(50)
  const [rleResult, setRleResult] = useState(null)
async function handleRLE() {
  if (!image) {
    alert("Please upload an image first!");
    return;
  }

  try {
    const response = await fetch(image);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const data = new Uint8Array(buffer);

    const encoded = rleEncode(Array.from(data));

    setRleResult({
      originalSize: data.length,
      compressedSize: encoded.length,
      encodedData: encoded,
    });

    console.log("RLE Result:", {
      originalSize: data.length,
      compressedSize: encoded.length,
      encodedData: encoded,
    });

    alert("RLE Compression function executed!");
  } catch (error) {
    console.error("Compression error:", error);
    alert("Compression failed: " + error.message);
  }
}
  function handleImageUpload(event) {
    const file = event.target.files[0]

    if (file) {
      setImage(URL.createObjectURL(file))
      setSlider(50)
    }
  }
  
  return (
    <div className="app">
      <h1>Region-Based Image Compression</h1>

      <p>Preserve the object, compress the background.</p>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />
      <button onClick={handleRLE} disabled={!image}>
          Run RLE Compression
      </button>
      {image && (
        <div className="comparison">
          <div className="image-panel">
            <h2>Before Compression</h2>
            <img src={image} alt="Original image" />
          </div>

          <div className="image-panel">
            <h2>After Compression (Preview)</h2>
            <div className="preview">
              <img
                src={image}
                alt="Compression preview"
                style={{
                  filter: `blur(${(100 - slider) / 25}px)`,
                }}
              />
            </div>
          </div>

          <div className="slider-control">
            <label>
              Comparison Slider: {slider}%
            </label>

            <input
              type="range"
              min="0"
              max="100"
              value={slider}
              onChange={(event) =>
                setSlider(Number(event.target.value))
              }
            />
          </div>
          {rleResult && (
  <div className="result">
    <h3>Compression Results</h3>
    <p>Original Size: {rleResult.originalSize} bytes</p>
    <p>Compressed Size: {rleResult.compressedSize} bytes</p>
    <p>
      Compression Ratio:
      {(rleResult.originalSize / Math.max(rleResult.compressedSize, 1)).toFixed(2)}
    </p>
  </div>
      )}
        </div>
      )}
    </div>
  )
}

export default App