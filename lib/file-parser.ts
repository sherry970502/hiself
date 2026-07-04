/** 文件 → 纯文本。支持 .md / .txt / .docx / .pdf */
export async function parseFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  const buf = Buffer.from(await file.arrayBuffer())

  if (name.endsWith('.md') || name.endsWith('.txt')) {
    return buf.toString('utf-8')
  }
  if (name.endsWith('.docx')) {
    const mammoth = (await import('mammoth')).default
    const result = await mammoth.extractRawText({ buffer: buf })
    return result.value
  }
  if (name.endsWith('.pdf')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js' as any)).default
    const result = await pdfParse(buf)
    return result.text
  }
  throw new Error(`不支持的文件格式: ${file.name}`)
}

/** 长文切分：按标题/空行分段，合并到 ~800 字左右的块 */
export function chunkText(text: string, targetSize = 800, maxChunks = 60): string[] {
  const paragraphs = text
    .split(/\n\s*\n|(?=^#{1,3}\s)/m)
    .map(p => p.trim())
    .filter(p => p.length > 20)

  const chunks: string[] = []
  let current = ''
  for (const p of paragraphs) {
    if (current && current.length + p.length > targetSize) {
      chunks.push(current)
      current = p
    } else {
      current = current ? `${current}\n\n${p}` : p
    }
    if (chunks.length >= maxChunks) break
  }
  if (current && chunks.length < maxChunks) chunks.push(current)
  return chunks
}
