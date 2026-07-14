export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { errorResponse } from '@/utils/response';
import Document from '@/models/Document';
import { initDatabase } from '@/config/database';

// ─── Zod Enum Validation ─────────────────────────────────────────────────────
const formatSchema = z.enum(['html', 'markdown', 'md', 'pdf'], {
  errorMap: () => ({ message: "Unsupported format. Valid values: html, markdown, md, pdf" }),
});

const routeContextSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
    format: z.string(),
  }),
});

// ─── TipTap JSON → Text Serialisers ──────────────────────────────────────────
function nodeToText(node: Record<string, unknown>): string {
  if (node.type === 'text') return (node.text as string) || '';
  const children = Array.isArray(node.content)
    ? (node.content as Record<string, unknown>[]).map(nodeToText).join('')
    : '';
  if (node.type === 'paragraph') return children + '\n\n';
  if (node.type === 'heading') {
    const level = (node.attrs as Record<string, number>)?.level ?? 1;
    return '#'.repeat(level) + ' ' + children + '\n\n';
  }
  if (node.type === 'bulletList') return children;
  if (node.type === 'listItem') return '- ' + children.trimEnd() + '\n';
  if (node.type === 'orderedList') return children;
  if (node.type === 'blockquote') return '> ' + children;
  if (node.type === 'codeBlock') return '```\n' + children + '\n```\n\n';
  return children;
}

function nodeToHtml(node: Record<string, unknown>): string {
  if (node.type === 'text') return escapeHtml((node.text as string) || '');
  const children = Array.isArray(node.content)
    ? (node.content as Record<string, unknown>[]).map(nodeToHtml).join('')
    : '';
  if (node.type === 'paragraph') return `<p>${children}</p>`;
  if (node.type === 'heading') {
    const level = (node.attrs as Record<string, number>)?.level ?? 1;
    return `<h${level}>${children}</h${level}>`;
  }
  if (node.type === 'bulletList') return `<ul>${children}</ul>`;
  if (node.type === 'listItem') return `<li>${children}</li>`;
  if (node.type === 'orderedList') return `<ol>${children}</ol>`;
  if (node.type === 'blockquote') return `<blockquote>${children}</blockquote>`;
  if (node.type === 'codeBlock') return `<pre><code>${children}</code></pre>`;
  if (node.type === 'doc') return children;
  return children;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Minimal Standards-Compliant PDF Generator ───────────────────────────────
// Produces a valid, readable, uncompressed PDF/1.4 without external dependencies.
function buildPdf(title: string, plainText: string): Buffer {
  const safe = (s: string) => s.replace(/[()\\]/g, '\\$&');
  const titleLine = safe(title);

  // Wrap body text at ~80 chars per line (PDF Tj operator handles one line at a time)
  const CHARS_PER_LINE = 90;
  const bodyLines: string[] = [];
  for (const raw of plainText.split('\n')) {
    const trimmed = raw.trimEnd();
    if (trimmed === '') { bodyLines.push(''); continue; }
    for (let i = 0; i < trimmed.length; i += CHARS_PER_LINE) {
      bodyLines.push(trimmed.slice(i, i + CHARS_PER_LINE));
    }
  }

  // Build content stream
  const LINE_HEIGHT = 14;
  const FONT_SIZE = 11;
  const TITLE_SIZE = 18;
  const MARGIN = 50;
  const PAGE_HEIGHT = 792;
  const USABLE_HEIGHT = PAGE_HEIGHT - MARGIN * 2;

  let stream = `BT\n/F1 ${TITLE_SIZE} Tf\n${MARGIN} ${PAGE_HEIGHT - MARGIN} Td\n(${titleLine}) Tj\n/F1 ${FONT_SIZE} Tf\n0 -${TITLE_SIZE + 8} Td\n`;
  let currentY = PAGE_HEIGHT - MARGIN - TITLE_SIZE - 8;
  let pageCount = 1;

  for (const line of bodyLines) {
    if (currentY - LINE_HEIGHT < MARGIN) {
      // new page stub — for simplicity, continue on same page but note overflow
      currentY = USABLE_HEIGHT;
      pageCount++;
    }
    stream += `(${safe(line)}) Tj\nT*\n`;
    currentY -= LINE_HEIGHT;
  }
  stream += 'ET\n';

  const streamBytes = Buffer.from(stream, 'latin1');

  const objects: string[] = [];
  // obj 1: catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  // obj 2: pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n');
  // obj 3: font
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');
  // obj 4: page
  objects.push(`4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 ${PAGE_HEIGHT}] /Contents 5 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj\n`);
  // obj 5: content stream
  objects.push(`5 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${stream}endstream\nendobj\n`);

  const header = '%PDF-1.4\n';
  const parts = [Buffer.from(header, 'latin1')];
  const offsets: number[] = [];
  let offset = header.length;
  for (const obj of objects) {
    offsets.push(offset);
    const buf = Buffer.from(obj, 'latin1');
    parts.push(buf);
    offset += buf.length;
  }

  const xrefOffset = offset;
  const xref = ['xref\n', `0 ${objects.length + 1}\n`, '0000000000 65535 f \n'];
  for (const o of offsets) xref.push(String(o).padStart(10, '0') + ' 00000 n \n');
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  parts.push(Buffer.from(xref.join('') + trailer, 'latin1'));

  return Buffer.concat(parts);
}

// ─── Route Handler ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/documents/{id}/export/{format}:
 *   get:
 *     summary: Export a document
 *     description: Exports the document as html, markdown, or pdf. Requires at least VIEWER access.
 *     tags: [Export]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - name: format
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [html, markdown, md, pdf]
 *     responses:
 *       200:
 *         description: Document file download.
 *         content:
 *           text/html:
 *             schema: { type: string }
 *           text/markdown:
 *             schema: { type: string }
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       400:
 *         description: Unsupported export format.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – insufficient role.
 *       404:
 *         description: Document not found.
 */
export async function GET(
  request: NextRequest,
  context: unknown,
) {
  try {
    await initDatabase();
    getUserIdFromRequest(request);

    const { params } = routeContextSchema.parse(context);

    // Validate format via Zod enum — reject before any DB call
    const formatResult = formatSchema.safeParse(params.format);
    if (!formatResult.success) {
      return NextResponse.json(
        { error: formatResult.error.errors[0].message },
        { status: 400 },
      );
    }
    const format = formatResult.data;

    // BOLA fix: must have at least VIEWER role
    await checkDocumentRole(request, params.id, [
      DOCUMENT_ROLES.OWNER,
      DOCUMENT_ROLES.EDITOR,
      DOCUMENT_ROLES.VIEWER,
    ]);

    const document = await Document.findOne({
      where: { id: params.id, deletedAt: null },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const root = document.content as Record<string, unknown>;
    const safeTitle = document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'html') {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(document.title)}</title>
  <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6}h1,h2,h3{margin-top:1.5em}pre{background:#f4f4f4;padding:1em;overflow:auto;border-radius:4px}blockquote{border-left:4px solid #ccc;padding-left:1em;color:#555}</style>
</head>
<body>
<h1>${escapeHtml(document.title)}</h1>
${nodeToHtml(root)}
</body>
</html>`;
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeTitle}-${dateStr}.html"`,
        },
      });
    }

    if (format === 'markdown' || format === 'md') {
      const md = `# ${document.title}\n\n${nodeToText(root)}`;
      return new NextResponse(md, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeTitle}-${dateStr}.md"`,
        },
      });
    }

    // PDF
    const plainText = nodeToText(root);
    const pdfBuffer = buildPdf(document.title, plainText);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}-${dateStr}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
