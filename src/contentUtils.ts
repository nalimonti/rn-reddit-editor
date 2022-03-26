import {PostQuillSegment, PostJSONSegment, QuillOp} from "./types";

const FORMAT_CODES = {
  BOLD: 1,
  ITALIC: 2,
  STRIKE: 8,
  SUPER: 32,
  CODE: 64,
}

export const serializeHTMLSegments = (row: PostQuillSegment[]) => {
  let t = '', formats: Array<number[]> = [];
  const segments: PostJSONSegment[] = [];
  for (let i = 0; i < row.length; i++) {
    const { text, attributes } = row[i],
      { bold, italic, strike, code, script, color, background, link } = attributes || {},
      isSpoiler = color === 'white' && background === 'black';
    if (link && link.length) {
      if (t.length) {
        segments.push({
          e: 'text',
          t,
          f: formats,
        });
      }
      segments.push({
        e: 'link',
        t: text,
        u: link,
      });
      t = '';
      formats = [];
      continue;
    }
    if (bold || italic || strike) {
      let weight = 0;
      if (bold) weight += FORMAT_CODES.BOLD;
      if (italic) weight += FORMAT_CODES.ITALIC;
      if (strike) weight += FORMAT_CODES.STRIKE;
      if (code) weight += FORMAT_CODES.CODE;
      if (script === 'super') weight += FORMAT_CODES.SUPER;
      if (!!weight) formats.push([ weight, t.length, t.length + (text || '').length ]);
    }
    t += text || '';
    if (isSpoiler || i === row.length - 1) {
      segments.push({
        e: isSpoiler ? 'spoilertext' : 'text',
        ...(
          !isSpoiler
            ? {
              t,
              f: formats,
            }
            : {
              c: [ { e: 'text', t } ]
            }
        ),
      });
      t = '';
      formats = [];
    }
  }
  return segments;
}

export const serializeQuillContent = (ops: QuillOp[], uploadIds?: { [filepath: string]: string }) => {
  console.log('submit', ops)
  const doc: Array<PostQuillSegment[]> = [];
  let text = '', attrs = {};

  //TODO handle image
  for (let i = 0; i < ops.length; i++) {
    const { insert, attributes } = ops[i],
      isImg = typeof insert === 'object' && 'image' in insert,
      hasNewline = typeof insert === 'string' && /\r|\n/g.test(insert || ''),
      hasNonNewline = typeof insert === 'string' && /[^\r|\n]/g.test(insert || '');

    if (isImg) {
      if (text.length) {
        doc.push([ { text, attributes: attrs } ]);
        text = '';
        attrs = {};
      }
      doc.push([ { text: undefined, attributes: { image: insert.image } } ]);
      doc.push([]);
      continue;
    }

    attrs = { ...(attrs || {}), ...(attributes || {}) };
    text += insert || '';

    if (!doc.length) {
      doc.push([ { text, attributes: attrs } ]);
      text = '';
      if (hasNewline) doc.push([]);
      continue;
    }

    if (hasNewline) {
      if (insert?.length === 1 && Object.keys(attributes || {}).length) {
        doc[doc.length - 1].forEach(segment => {
          segment.attributes = { ...(segment.attributes || {}), ...attributes };
        })
      }
      if (!hasNonNewline) {
        doc[doc.length - 1].push({ text, attributes: text.length > 1 ? attrs : undefined });
        text = '';
        attrs = {};
      }

      if (i === ops.length - 1) {
        doc[doc.length - 1].push({ text, attributes: attrs });
        continue;
      }

      doc.push([]);
      continue;
    }
    doc[doc.length - 1].push({ text, attributes: attrs });
    text = '';
    attrs = {
      ...attributes,
      ...(attributes?.link ? { link: undefined} : {}),
    };
  }

  console.log('doc', doc);

  const serialized = [];
  for (let i = 0; i < doc.length; i++) {
    const row: PostQuillSegment[] = doc[i];
    const [ first ] = row || [],
      { header, blockquote, list, 'code-block': isCodeBlock, image } = first?.attributes ?? {};
    if (image && image.length) {
      const { [image]: assetId } = uploadIds || {};
      serialized.push({
        e: 'img',
        id: assetId,
      })
      continue;
    }
    if (header) {
      serialized.push({
        e: 'h',
        l: 1,
        c: [
          {
            e: 'raw',
            t: (row || []).map(({ text }) => text).join('')
          }
        ]
      })
      continue;
    }
    if (isCodeBlock) {
      let endIdx = i, codeBlock = false;
      do {
        const [ s ] = doc[endIdx + 1] || [],
          { 'code-block': cb } = s?.attributes ?? {};
        if (codeBlock) endIdx++;
        codeBlock = !!cb;
      } while (codeBlock);
      serialized.push({
        e: 'code',
        c: doc.slice(i, endIdx).map(row => {
          return {
            e: 'raw',
            t: row.map(({ text }) => text).join(''),
          }
        })
      })
      if (endIdx - 1 > i) i = endIdx - 1;
      continue;
    }
    if (blockquote) {
      let endIdx = i, isBlockquote = false;
      do {
        const [ s ] = doc[endIdx + 1],
          { blockquote } = s?.attributes ?? {};
        if (isBlockquote) endIdx++;
        isBlockquote = !!blockquote;
      } while (isBlockquote)
      serialized.push({
        e: 'blockquote',
        c: doc.slice(i, endIdx).map(row => {
          return {
            e: 'par',
            c: serializeHTMLSegments(row),
          }
        })
      })
      if (endIdx - 1 > i) i = endIdx - 1;
      continue;
    }
    if (!!list) {
      let endIdx = i, isList = false;
      do {
        const [ s ] = doc[endIdx + 1],
          { text } = s || {},
          { list: sList } = s?.attributes ?? {};
        if (typeof text === 'string' && /\r|\n/g.test(text) && text.length === 1) {
          endIdx++;
          isList = true;
          continue;
        }
        if (list === sList) endIdx++;
        isList = sList === list;
      } while (isList)
      serialized.push({
        e: 'list',
        o: list === 'ordered',
        c: doc.slice(i, endIdx + 1).map(row => {
          return {
            e: 'li',
            c: [
              {
                e: 'par',
                c: serializeHTMLSegments(row),
              }
            ]
          }
        }),
      })
      if (endIdx > i) i = endIdx;
      continue;
    }
    serialized.push({
      e: 'par',
      c: serializeHTMLSegments(row),
    })
  }
  console.log('xcv', serialized)
  return { document: serialized };
}
