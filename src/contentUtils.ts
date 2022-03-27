import {PostQuillSegment, PostJSONSegment} from "./types";
import { DOMParser } from 'xmldom';

const FORMAT_CODES = {
  BOLD: 1,
  ITALIC: 2,
  STRIKE: 8,
  SUPER: 32,
  CODE: 64,
}

export const serializeHTMLSegments = (row: PostQuillSegment[], stripNewlines?: boolean) => {
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
    if (bold || italic || strike || code || script) {
      let weight = 0;
      if (bold) weight += FORMAT_CODES.BOLD;
      if (italic) weight += FORMAT_CODES.ITALIC;
      if (strike) weight += FORMAT_CODES.STRIKE;
      if (code) weight += FORMAT_CODES.CODE;
      if (script === 'super') weight += FORMAT_CODES.SUPER;
      if (!!weight && !!text?.length && /[^\s]/.test(text)) {
        let len = (text || '').length;
        if (text[text.length - 1] === ' ') len = text.length - 1;
        formats.push([ weight, t.length, len ]);
      }
    }
    t += text || '';
    if (stripNewlines) t = _stripNewlines(t);
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

const _stripNewlines = (str: string) => str.replace(/\r|\n/g, '')

type Segment = { text: string; tags: string[] }
type Formats = Array<number[]>;

const serializeChildNodes = (node: ChildNode) => {
  const iterate = (n: ChildNode, parts: Segment[], tags: string[]): Segment[] => {
    if (n.nodeType === 3 && !!n.nodeValue) {
      parts.push({ text: n.nodeValue, tags: [ ...tags ] });
    }
    const children = Array.from(n.childNodes || []);
    children?.forEach(c => iterate(c, parts, [ ...tags, c.nodeName ]));
    return parts;
  }
  const segments = iterate(node, [], [ node.nodeName ]),
    f: Formats = [];
  let t = '';
  segments.forEach(({ text, tags }) => {
    let tagWeight = 0;
    tags.forEach(tag => {
      if (['strong', 'b'].includes(tag)) tagWeight += FORMAT_CODES.BOLD;
      if (tag === 's') tagWeight += FORMAT_CODES.STRIKE;
      if (['i', 'em'].includes(tag)) tagWeight += FORMAT_CODES.ITALIC;
      if (tag === 'code') tagWeight = FORMAT_CODES.CODE;
      if (tag === 'sup') tagWeight = FORMAT_CODES.SUPER;
    })
    if (!!tagWeight && text.length && /[^\s]/.test(text)) {
      let len = text.length;
      if (text[text.length - 1] === ' ') len = text.length - 1;
      f.push([ tagWeight, t.length, len ]);
    }
    t += text;
  })
  return { t, ...(f.length ? { f } : {}) };
}

const serializeCodeBlock = (node: ChildNode, serialized) => {
  const codeText = node.childNodes.item(0).nodeValue;
  if (codeText?.length) {
    serialized.push({
      e: 'code',
      c: codeText.split(/\n|\r/).map(t => ({ e: 'raw', t }))
    })
  }
}

const serializeList = (node: ChildNode, serialized) => {
  serialized.push({
    e: 'list',
    o: node.nodeName === 'ol',
    c: Array.from(node.childNodes || []).map(x => ({
      e: 'li',
      c: [
        {
          e: 'par',
          c: [
            {
              e: 'text',
              ...serializeChildNodes(x)
            }
          ]
        }
      ]
    })),
  })
}

const serializeHeader = (node: ChildNode, serialized) => {
  serialized.push({
    e: 'h',
    l: 1,
    c: [
      {
        e: 'raw',
        t: node.childNodes.item(0).nodeValue,
      }
    ]
  })
}

const serializeBlockquote = (nodes: ChildNode[], serialized) => {
  serialized.push({
    e: 'blockquote',
    c: nodes.map(x => ({
      e: 'par',
      c: [
        {
          e: 'text',
          ...serializeChildNodes(x)
        }
      ]
    }))
  });
}

export const serializeQuillContent = (html: string, uploadIds?: { [filepath: string]: string }) => {
  console.log('submit', html)
  const parsedDoc = html?.length ? new DOMParser().parseFromString(html, 'text/html') : undefined;
  const htmlSerialized = [];
  const nodes = parsedDoc?.childNodes;
  if (nodes?.length) {
    for (let i = 0; i <= nodes.length - 1; i++) {
      const node = nodes.item(i),
        type = node.nodeName;
      switch (type) {
        case 'h1':
          serializeHeader(node, htmlSerialized);
          continue;
        case 'ol':
        case 'ul':
          serializeList(node, htmlSerialized);
          continue;
        case 'blockquote':
          let endIdx = i, nextNode;
          do {
            nextNode = nodes.item(endIdx + 1);
            if (nextNode?.nodeName === 'blockquote') endIdx++;
          } while (nextNode?.nodeName === 'blockquote' && endIdx < nodes.length - 2)
          serializeBlockquote(Array.from(nodes).slice(i, endIdx + 1), htmlSerialized)
          if (endIdx > i) i = endIdx;
          continue;
        case 'pre':
          serializeCodeBlock(node, htmlSerialized);
          continue;
        default:
          htmlSerialized.push({
            e: 'par',
            c: [
              {
                e: 'text',
                ...serializeChildNodes(node),
              }
            ]
          })
      }
    }
  }
  console.log('html serialized', htmlSerialized)

  return { document: htmlSerialized };
}
