import fs from 'fs'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'

// @arcsin1/html2pptx 0.2.1 writes speaker notes as a single <a:p> whose <a:t> holds the raw
// text, line feeds included. PowerPoint does not treat those line feeds as paragraph breaks,
// so a multi-paragraph speech script collapses. This rewrites each notes slide so every line
// becomes its own paragraph and blank lines stay as empty paragraphs (upstream issue #159).

const NOTES_SLIDE_PATTERN = /^ppt\/notesSlides\/notesSlide\d+\.xml$/
const SINGLE_RUN_PARAGRAPH = /<a:p><a:r><a:rPr lang="([^"]*)"( dirty="0")?\/><a:t>([\s\S]*?)<\/a:t><\/a:r><\/a:p>/

function splitNotesSlideXml(xml: string): string {
  const match = xml.match(SINGLE_RUN_PARAGRAPH)
  if (!match) return xml
  const [whole, lang, dirty = '', text] = match
  if (!/\r?\n/.test(text)) return xml
  const paragraphs = text
    .split(/\r?\n/)
    .map((line) =>
      line.length > 0
        ? `<a:p><a:r><a:rPr lang="${lang}"${dirty}/><a:t>${line}</a:t></a:r></a:p>`
        : `<a:p><a:endParaRPr lang="${lang}"${dirty}/></a:p>`
    )
    .join('')
  return xml.replace(whole, () => paragraphs)
}

export function splitPptxNotesParagraphs(bytes: Uint8Array): Uint8Array {
  const files = unzipSync(bytes)
  let changed = false
  for (const name of Object.keys(files)) {
    if (!NOTES_SLIDE_PATTERN.test(name)) continue
    const before = strFromU8(files[name])
    const after = splitNotesSlideXml(before)
    if (after !== before) {
      files[name] = strToU8(after)
      changed = true
    }
  }
  return changed ? zipSync(files) : bytes
}

export async function applySpeakerNotesToPptxFile(filePath: string): Promise<void> {
  const input = new Uint8Array(await fs.promises.readFile(filePath))
  const output = splitPptxNotesParagraphs(input)
  if (output !== input) await fs.promises.writeFile(filePath, output)
}
