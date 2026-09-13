import { PNG } from 'pngjs'

/**
 * 把多張寬度相同的 PNG 縱向無縫拼接成一張長圖，返回新 PNG 的 Buffer。
 *
 * PNG 內部像素經過「逐行過濾 + zlib 壓縮」，不能直接首尾相接；這裏逐張解碼出
 * 原始 RGBA 像素，按頁順序縱向塊拷貝到一塊總畫布，再重新編碼爲單張 PNG。
 * 同一個 session 的所有頁面共用 slideSize，寬度恆定，因此只累加高度。
 */
export function stitchPngBuffersVertical(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) {
    throw new Error('沒有可拼接的頁面')
  }

  const images = buffers.map((buf) => PNG.sync.read(buf))
  const width = images[0].width
  for (const img of images) {
    if (img.width !== width) {
      throw new Error('頁面寬度不一致，無法拼接長圖')
    }
  }

  const totalHeight = images.reduce((sum, img) => sum + img.height, 0)
  const merged = new PNG({ width, height: totalHeight })

  let yOffset = 0
  for (const img of images) {
    PNG.bitblt(img, merged, 0, 0, img.width, img.height, 0, yOffset)
    yOffset += img.height
  }

  return PNG.sync.write(merged)
}
