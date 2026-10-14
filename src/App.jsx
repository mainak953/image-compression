import { useState } from 'react'
import './App.css'
import { rleEncode } from './rle'
import { removeBackground } from '@imgly/background-removal'
import imageCompression from 'browser-image-compression'
function App() {
  const [image, setImage] = useState(null)
  const [slider, setSlider] = useState(50)
  const [rleResult, setRleResult] = useState(null)
  const [segmentedImage, setSegmentedImage] = useState(null)
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedImage, setCompressedImage] = useState(null)
  const [compressionStats, setCompressionStats] = useState(null)
  async function handleBackgroundRemoval() {
  if (!image) {
    alert('Please upload an image first!')
    return
  }

  try {
    
    setIsRemovingBackground(true)

    const response = await fetch(image)
    const blob = await response.blob()

    const resultBlob = await removeBackground(blob)
    const resultUrl = URL.createObjectURL(resultBlob)

    setSegmentedImage(resultUrl)
    console.log("Foreground extracted successfully:", resultBlob.size, "bytes");
    alert('Background removal completed!')
  } catch (error) {
    console.error('Background removal error:', error)
    alert('Background removal failed. Check the console.')
  } finally {
    setIsRemovingBackground(false)
  }
}
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
  async function handleImageCompression() {
  if (!image) {
    alert('Please upload an image first!')
    return
  }

  try {
    setIsCompressing(true)

    const response = await fetch(image)
    const originalBlob = await response.blob()

    const options = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    }

    const compressedBlob = await imageCompression(
      originalBlob,
      options
    )

    const compressedUrl = URL.createObjectURL(compressedBlob)
    // Merge compressed background with preserved foreground
if (segmentedImage) {
  const backgroundImg = new Image()
  const foregroundImg = new Image()

  backgroundImg.src = compressedUrl
  foregroundImg.src = segmentedImage

  await Promise.all([
    new Promise((resolve, reject) => {
      backgroundImg.onload = resolve
      backgroundImg.onerror = reject
    }),
    new Promise((resolve, reject) => {
      foregroundImg.onload = resolve
      foregroundImg.onerror = reject
    })
  ])

  const canvas = document.createElement('canvas')
  canvas.width = foregroundImg.naturalWidth
  console.log("Background dimensions:", backgroundImg.naturalWidth, backgroundImg.naturalHeight)
  console.log("Foreground dimensions:", foregroundImg.naturalWidth, foregroundImg.naturalHeight)
  canvas.height = foregroundImg.naturalHeight

  const ctx = canvas.getContext('2d')

  ctx.drawImage(
    backgroundImg,
    0,
    0,
    canvas.width,
    canvas.height
  )

  ctx.drawImage(
    foregroundImg,
    0,
    0,
    canvas.width,
    canvas.height
  )

  const finalBlob = await new Promise(resolve =>
    canvas.toBlob(resolve, 'image/jpeg', 0.9)
  )

  if (!finalBlob) {
    throw new Error('Failed to merge foreground and background')
  }

  const finalUrl = URL.createObjectURL(finalBlob)

  setCompressedImage(finalUrl)

  setCompressionStats({
    originalSize: originalBlob.size,
    compressedSize: finalBlob.size,
    reduction: (
      (originalBlob.size - finalBlob.size) /
      originalBlob.size *
      100
    ).toFixed(2)
  })

  return
}
    setCompressedImage(compressedUrl)

    setCompressionStats({
      originalSize: originalBlob.size,
      compressedSize: compressedBlob.size,
      reduction: (
        (originalBlob.size - compressedBlob.size) /
        originalBlob.size * 100
      ).toFixed(2),
    })
  } catch (error) {
    console.error('Image compression error:', error)
    alert('Image compression failed!')
  } finally {
    setIsCompressing(false)
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
      <button
          type="button"
          onClick={handleBackgroundRemoval}
          disabled={!image || isRemovingBackground}
      >
          {isRemovingBackground ? 'Removing Background...' : 'Remove Background'}
      </button>
      <button
          type="button"
          onClick={handleImageCompression}
          disabled={!image || isCompressing}
     >
         {isCompressing ? 'Compressing...' : 'Compress Image'}
      </button>
      {image && (
        <div className="comparison">
          <div className="image-panel">
            <h2>Before Compression</h2>
            <img src={image} alt="Original image" />
          </div>

          <div className="image-panel">
            <h2>Background Removed / Compression Preview</h2>
            <div className="preview">
              <img
                src={segmentedImage || image}
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
    <p>
  Original Size: {rleResult.originalSize} bytes
</p>

<p>
  Encoded Size: {rleResult.compressedSize} bytes
</p>

<p>
  Compression Ratio: {
    (rleResult.compressedSize / Math.max(rleResult.originalSize, 1)).toFixed(2)
  }
</p>

<p>
  Size Change: {
    (
      (rleResult.originalSize - rleResult.compressedSize) /
      Math.max(rleResult.originalSize, 1) * 100
    ).toFixed(2)
  }%
</p>
  </div>
    
      )}
      {compressionStats && (
  <div className="result">
    <h3>Actual Image Compression Results</h3>

    <p>
      Original Size: {compressionStats.originalSize} bytes
    </p>

    <p>
      Compressed Size: {compressionStats.compressedSize} bytes
    </p>

    <p>
      Size Reduction: {compressionStats.reduction}%
    </p>

    {compressedImage && (
      <a href={compressedImage} download="compressed-image.jpg">
        Download Compressed Image
      </a>
    )}
  </div>
)}
        </div>
      )}
    </div>
  )
}

export default App