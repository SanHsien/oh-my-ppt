import fs from 'fs'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'

// @arcsin1/html2pptx 0.2.1 writes speaker notes in a way Microsoft PowerPoint does not accept
// as-is (upstream issue #159). This post-processes the written package:
//  1. The notes master's theme relationship points at the slide master's theme1.xml. PowerPoint
//     refuses a package where two masters share one theme part ("file is corrupt", 0x80070570),
//     so the notes master gets its own copy of the theme.
//  2. Each notes slide holds a single <a:p> whose <a:t> keeps the raw line feeds. PowerPoint does
//     not treat those as paragraph breaks, so every line becomes its own paragraph and blank lines
//     stay as empty paragraphs.
//  3. Characters XML 1.0 forbids (C0 controls other than tab/LF/CR, U+FFFE, U+FFFF) are passed
//     through unescaped, which makes the notes slide non-well-formed. They are dropped.

const NOTES_SLIDE_PATTERN = /^ppt\/notesSlides\/notesSlide\d+\.xml$/
const SINGLE_RUN_PARAGRAPH = /<a:p><a:r><a:rPr lang="([^"]*)"( dirty="0")?\/><a:t>([\s\S]*?)<\/a:t><\/a:r><\/a:p>/
// eslint-disable-next-line no-control-regex
const XML_FORBIDDEN_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g

const NOTES_MASTER_RELS = 'ppt/notesMasters/_rels/notesMaster1.xml.rels'
const SLIDE_MASTER_RELS = 'ppt/slideMasters/_rels/slideMaster1.xml.rels'
const CONTENT_TYPES = '[Content_Types].xml'
const THEME_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.theme+xml'
const THEME_RELATIONSHIP = /(Type="[^"]*\/theme" Target="\.\.\/theme\/)([^"]+)(")/

function splitNotesSlideXml(xml: string): string {
  const cleaned = xml.replace(XML_FORBIDDEN_CHARS, '')
  const match = cleaned.match(SINGLE_RUN_PARAGRAPH)
  if (!match) return cleaned
  const [whole, lang, dirty = '', text] = match
  if (!/\r?\n/.test(text)) return cleaned
  const paragraphs = text
    .split(/\r?\n/)
    .map((line) =>
      line.length > 0
        ? `<a:p><a:r><a:rPr lang="${lang}"${dirty}/><a:t>${line}</a:t></a:r></a:p>`
        : `<a:p><a:endParaRPr lang="${lang}"${dirty}/></a:p>`
    )
    .join('')
  return cleaned.replace(whole, () => paragraphs)
}

/** Give the notes master a theme part of its own when it shares the slide master's. */
function separateNotesMasterTheme(files: Record<string, Uint8Array>): boolean {
  const notesRels = files[NOTES_MASTER_RELS]
  const masterRels = files[SLIDE_MASTER_RELS]
  const contentTypes = files[CONTENT_TYPES]
  if (!notesRels || !masterRels || !contentTypes) return false
  const notesRelsXml = strFromU8(notesRels)
  const notesTheme = notesRelsXml.match(THEME_RELATIONSHIP)?.[2]
  const masterTheme = strFromU8(masterRels).match(THEME_RELATIONSHIP)?.[2]
  if (!notesTheme || notesTheme !== masterTheme) return false
  const source = files[`ppt/theme/${notesTheme}`]
  if (!source) return false
  let index = 2
  while (files[`ppt/theme/theme${index}.xml`]) index += 1
  const themeName = `theme${index}.xml`
  files[`ppt/theme/${themeName}`] = source.slice()
  files[NOTES_MASTER_RELS] = strToU8(
    notesRelsXml.replace(THEME_RELATIONSHIP, (_all, head: string, _old: string, tail: string) =>
      `${head}${themeName}${tail}`
    )
  )
  files[CONTENT_TYPES] = strToU8(
    strFromU8(contentTypes).replace(
      '</Types>',
      `<Override PartName="/ppt/theme/${themeName}" ContentType="${THEME_CONTENT_TYPE}"/></Types>`
    )
  )
  return true
}

export function splitPptxNotesParagraphs(bytes: Uint8Array): Uint8Array {
  const files = unzipSync(bytes)
  let changed = separateNotesMasterTheme(files)
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
