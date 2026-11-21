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

  it('keeps the notes master and its theme relationship so PowerPoint can open the notes', async () => {
    const raw = await generatePptx({ title: 't', slides: [{ texts: [], notes: 'a\nb' }] })
    const files = unzipSync(splitPptxNotesParagraphs(new Uint8Array(raw)))
    expect(Object.keys(files)).toContain('ppt/notesMasters/notesMaster1.xml')
    expect(strFromU8(files['ppt/notesMasters/_rels/notesMaster1.xml.rels'])).toContain(
      'Target="../theme/theme1.xml"'
    )
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
