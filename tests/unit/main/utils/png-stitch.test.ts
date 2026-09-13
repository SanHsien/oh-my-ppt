import { describe, expect, it } from 'vitest'
import { PNG } from 'pngjs'
import { stitchPngBuffersVertical } from '../../../../src/main/io/thumbnails/png-stitch'

type Rgba = [number, number, number, number]

type DecodedPng = { width: number; height: number; data: Buffer }

function makeSolidPng(width: number, height: number, rgba: Rgba): Buffer {
  const png = new PNG({ width, height })
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = rgba[0]
    png.data[i + 1] = rgba[1]
    png.data[i + 2] = rgba[2]
    png.data[i + 3] = rgba[3]
  }
  return PNG.sync.write(png)
}

function readPixel(img: DecodedPng, x: number, y: number): Rgba {
  const i = (img.width * y + x) * 4
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]
}

describe('stitchPngBuffersVertical', () => {
  it('縱向無縫拼接多張同寬 PNG，尺寸與像素按頁順序正確', () => {
    const red = makeSolidPng(4, 2, [255, 0, 0, 255])
    const blue = makeSolidPng(4, 3, [0, 0, 255, 255])

    const merged = stitchPngBuffersVertical([red, blue])
    const img = PNG.sync.read(merged) as DecodedPng

    expect(img.width).toBe(4)
    expect(img.height).toBe(5) // 2 + 3
    // 第一段(y=0..1)紅，第二段(y=2..4)藍，邊界無縫
    expect(readPixel(img, 0, 0)).toEqual([255, 0, 0, 255])
    expect(readPixel(img, 0, 1)).toEqual([255, 0, 0, 255])
    expect(readPixel(img, 0, 2)).toEqual([0, 0, 255, 255])
    expect(readPixel(img, 0, 4)).toEqual([0, 0, 255, 255])
  })

  it('單張 PNG 原樣返回等尺寸結果', () => {
    const green = makeSolidPng(3, 3, [0, 255, 0, 255])
    const merged = stitchPngBuffersVertical([green])
    const img = PNG.sync.read(merged) as DecodedPng

    expect(img.width).toBe(3)
    expect(img.height).toBe(3)
    expect(readPixel(img, 1, 1)).toEqual([0, 255, 0, 255])
  })

  it('寬度不一致時拋錯', () => {
    const a = makeSolidPng(4, 2, [0, 0, 0, 255])
    const b = makeSolidPng(3, 2, [0, 0, 0, 255])
    expect(() => stitchPngBuffersVertical([a, b])).toThrow()
  })

  it('空數組拋錯', () => {
    expect(() => stitchPngBuffersVertical([])).toThrow()
  })
})
