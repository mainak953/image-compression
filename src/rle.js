export function rleEncode(data) {
  if (data.length === 0) {
    return []
  }

  const encoded = []
  let count = 1

  for (let i = 1; i < data.length; i++) {
    if (data[i] === data[i - 1] && count < 255) {
      count++
    } else {
      encoded.push(count, data[i - 1])
      count = 1
    }
  }

  encoded.push(count, data[data.length - 1])

  return encoded
}