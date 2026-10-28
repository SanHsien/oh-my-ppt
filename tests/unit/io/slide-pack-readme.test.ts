import { describe, expect, it } from 'vitest'
import { SLIDE_PACK_TARGETS, slidePackReadme } from '../../../src/main/io/slide-pack-readme'

describe('slide pack README', () => {
  it('lists exactly the viewer binaries that are built', () => {
    const readme = slidePackReadme()
    for (const target of SLIDE_PACK_TARGETS)
      expect(readme).toContain(`*-${target.platform}${target.ext}`)
    expect(readme.toLowerCase()).not.toContain('macos')
    expect(readme).not.toContain('.app.zip')
  })
})
