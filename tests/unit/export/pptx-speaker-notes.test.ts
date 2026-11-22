import fs from 'fs'
import path from 'path'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { generatePptx } from '@arcsin1/html2pptx'
import { describe, expect, it } from 'vitest'
import { extractSpeechNotesForPage } from '../../../src/main/speech/handlers'
import { splitPptxNotesParagraphs } from '../../../src/main/io/html-pptx/notes-paragraphs'

// Upstream issue arcsin1/oh-my-ppt#159: the editable PPTX export dropped the session speech
// script, so PowerPoint showed empty speaker notes. These tests pin that each exported slide
// carries its own page's script, and that paragraph breaks and blank lines survive as real
// OOXML paragraphs instead of raw line feeds inside one <a:t>.

const script = [
  '## Slide 1: 開場\n\n大家好。\n\n今天談三件事。',
  '## Slide 2: 市場\n\n第二頁講稿',
  '## Slide 10: 結語\n\n謝謝大家'
].join('\n\n---\n\n')

describe('extractSpeechNotesForPage', () => {
  it('returns only the matching page body without its heading, keeping the blank line', () => {
    expect(extractSpeechNotesForPage(script, 1, '開場')).toBe('大家好。\n\n今天談三件事。')
    expect(extractSpeechNotesForPage(script, 2, '')).toBe('第二頁講稿')
  })

  it('does not hand slide 10 notes to slide 1', () => {
    expect(extractSpeechNotesForPage(script, 10, '')).toBe('謝謝大家')
    expect(extractSpeechNotesForPage('## Slide 10: 結語\n\n謝謝大家', 1, '')).toBeUndefined()
  })

  it('prefers the page number over a title match on another page', () => {
    // Page 3 shares the title of page 2; it has no section, so it must get nothing.
    expect(extractSpeechNotesForPage(script, 3, '市場')).toBeUndefined()
  })

  it('reads only the leading page number of a heading', () => {
    // Slide 1 has no section; slide 2's heading mentions "slide 1" later on.
    const recap = '## Slide 2: recap of slide 1\n\n回顧第一頁'
    expect(extractSpeechNotesForPage(recap, 1, '')).toBeUndefined()
    expect(extractSpeechNotesForPage(recap, 2, '')).toBe('回顧第一頁')
    const zhRecap = '## 第 2 頁：回顧第 1 頁\n\n回顧'
    expect(extractSpeechNotesForPage(zhRecap, 1, '')).toBeUndefined()
    expect(extractSpeechNotesForPage(zhRecap, 2, '')).toBe('回顧')
  })

  it('returns undefined when there is no script or the section has no body', () => {
    expect(extractSpeechNotesForPage(null, 1, '開場')).toBeUndefined()
    expect(extractSpeechNotesForPage('## Slide 1: 開場', 1, '開場')).toBeUndefined()
  })

  it('normalizes CRLF scripts', () => {
    expect(extractSpeechNotesForPage('## Slide 1: A\r\n\r\n一\r\n\r\n二', 1, 'A')).toBe('一\n\n二')
  })
})

const notesXml = (bytes: Uint8Array, index = 1): string =>
  strFromU8(unzipSync(bytes)[`ppt/notesSlides/notesSlide${index}.xml`])

describe('splitPptxNotesParagraphs', () => {
  it('writes each line as its own paragraph and keeps blank lines as empty paragraphs', async () => {
    const raw = await generatePptx({
      title: 't',
      slides: [{ texts: [], notes: '第一段\n\n第二段 & <x>' }]
    })
    const fixed = splitPptxNotesParagraphs(new Uint8Array(raw))
    const body = notesXml(fixed).match(/<p:txBody>[\s\S]*<\/p:txBody>/)?.[0] ?? ''
    const paragraphs = body.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? []
    expect(paragraphs).toHaveLength(3)
    expect(paragraphs[0]).toContain('<a:t>第一段</a:t>')
    expect(paragraphs[1]).not.toContain('<a:t>')
    expect(paragraphs[1]).toContain('<a:endParaRPr')
    expect(paragraphs[2]).toContain('<a:t>第二段 &amp; &lt;x&gt;</a:t>')
    expect(body).not.toMatch(/<a:t>[^<]*\n/)
  })

  // PowerPoint rejects a package whose notes master shares the slide master's theme part
  // ("file is corrupt", 0x80070570); html2pptx 0.2.1 points both at theme1.xml.
  it.each([
    ['multi-line notes', 'a\nb'],
    ['single-line notes', 'one line']
  ])('gives the notes master its own theme part (%s)', async (_label, notes) => {
    const raw = await generatePptx({ title: 't', slides: [{ texts: [], notes }] })
    const files = unzipSync(splitPptxNotesParagraphs(new Uint8Array(raw)))
    const themeTarget = (rels: string): string | undefined =>
      rels.match(/Type="[^"]*\/theme" Target="\.\.\/theme\/([^"]+)"/)?.[1]
    const masterTheme = themeTarget(strFromU8(files['ppt/slideMasters/_rels/slideMaster1.xml.rels']))
    const notesTheme = themeTarget(strFromU8(files['ppt/notesMasters/_rels/notesMaster1.xml.rels']))
    expect(masterTheme).toBe('theme1.xml')
    expect(notesTheme).toBeDefined()
    expect(notesTheme).not.toBe(masterTheme)
    expect(Object.keys(files)).toContain(`ppt/theme/${notesTheme}`)
    expect(strFromU8(files['[Content_Types].xml'])).toContain(
      `<Override PartName="/ppt/theme/${notesTheme}" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>`
    )
  })

  it('drops characters that XML 1.0 forbids so the notes slide stays well-formed', async () => {
    const raw = await generatePptx({
      title: 't',
      slides: [
        { texts: [], notes: 'A\u0001B\u0008C D\uFFFF' },
        { texts: [], notes: 'x\u001F\ny' }
      ]
    })
    const fixed = splitPptxNotesParagraphs(new Uint8Array(raw))
    // eslint-disable-next-line no-control-regex
    const forbidden = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/
    expect(notesXml(fixed, 1)).not.toMatch(forbidden)
    expect(notesXml(fixed, 1)).toContain('<a:t>ABC D</a:t>')
    expect(notesXml(fixed, 2)).not.toMatch(forbidden)
    expect(notesXml(fixed, 2)).toContain('<a:t>x</a:t>')
  })

  it('leaves a package without notes byte-for-byte untouched', () => {
    const input = zipSync({ '[Content_Types].xml': strToU8('<Types/>') })
    expect(splitPptxNotesParagraphs(input)).toBe(input)
  })
})

describe('export:pptx wiring', () => {
  const source = fs.readFileSync(path.resolve('src/main/io/export-handlers.ts'), 'utf8')
  const handler = source.slice(
    source.indexOf("ipcMain.handle('export:pptx'"),
    source.indexOf("ipcMain.handle('export:video'")
  )

  it('reads the session speech script and attaches per-page notes to the slides', () => {
    expect(handler).toContain('readSpeechScript(projectDir)')
    expect(handler).toContain('extractSpeechNotesForPage(speechScript, page.pageNumber, page.title)')
    expect(handler).toContain('applySpeakerNotesToPptxFile(saveResult.filePath)')
  })
})
