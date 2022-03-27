import {PostQuillSegment, RichTextJSONSegment} from "./types";
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
  const segments: RichTextJSONSegment[] = [];
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

// TODO handle spoilers
const serializeChildNodes = (node: ChildNode) => {
  const iterate = (n: ChildNode|Element, parts: Segment[], tags: string[]): Segment[] => {
    //TODO better way to handle this?
    const href = n.attributes?.getNamedItem('href')?.nodeValue;
    if (n.nodeType === 3 && !!n.nodeValue) {
      parts.push({ text: n.nodeValue, tags: [ ...tags ] });
    }
    const children = Array.from(n.childNodes || []);
    children?.forEach(c => iterate(c, parts, [ ...tags, c.nodeName, ...(href?.length ? [ `href:${href}` ] : []) ]));
    return parts;
  }
  const segments = iterate(node, [], [ node.nodeName ]),
    ret: RichTextJSONSegment[] = [];
  let t = '', f: Formats = [];
  segments.forEach(({ text, tags }) => {
    if (tags.includes('a')) {
      if (t.length) ret.push({ e: 'text', t, f: [ ...f ] });
      const href = tags.find(t => t.includes('href:'))?.replace('href:', '');
      ret.push({ e: 'link', t: text, u: href });
      t = '';
      f = [];
      return;
    }
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
  ret.push({ e: 'text', t, ...(f.length ? { f } : {}) });
  return ret;
}

const serializeCodeBlock = (node: ChildNode, segments: RichTextJSONSegment[]) => {
  const codeText = node.childNodes.item(0).nodeValue;
  if (codeText?.length) {
    segments.push({
      e: 'code',
      c: codeText.split(/\n|\r/).map(t => ({ e: 'raw', t }))
    })
  }
}

const serializeList = (node: ChildNode, segments: RichTextJSONSegment[]) => {
  segments.push({
    e: 'list',
    o: node.nodeName === 'ol',
    c: Array.from(node.childNodes || []).map(x => ({
      e: 'li',
      c: [ { e: 'par', c: serializeChildNodes(x) } ]
    })),
  })
}

const serializeHeader = (node: ChildNode, segments: RichTextJSONSegment[]) => {
  segments.push({
    e: 'h',
    l: 1,
    c: [ { e: 'raw', t: node.childNodes.item(0).nodeValue || '' } ]
  })
}

const serializeBlockquote = (nodes: ChildNode[], segments: RichTextJSONSegment[]) => {
  segments.push({
    e: 'blockquote',
    c: nodes.map(x => ({ e: 'par', c: serializeChildNodes(x) }))
  });
}

export const htmlToRichTextJSON = (html: string, uploadIds?: { [filepath: string]: string }) => {
  const parsedDoc = html?.length ? new DOMParser().parseFromString(html, 'text/html') : undefined;
  const segments: RichTextJSONSegment[] = [];
  const nodes = parsedDoc?.childNodes;
  if (nodes?.length) {
    for (let i = 0; i <= nodes.length - 1; i++) {
      const node = nodes.item(i),
        type = node.nodeName;
      switch (type) {
        case 'h1':
          serializeHeader(node, segments);
          continue;
        case 'ol':
        case 'ul':
          serializeList(node, segments);
          continue;
        case 'blockquote':
          let endIdx = i, nextNode;
          // find the ending index of the blockquote
          do {
            nextNode = nodes.item(endIdx + 1);
            if (nextNode?.nodeName === 'blockquote') endIdx++;
          } while (nextNode?.nodeName === 'blockquote' && endIdx < nodes.length - 2)
          // serialize all blockquote segments
          serializeBlockquote(Array.from(nodes).slice(i, endIdx + 1), segments)
          // jump to the segment immediately following the final blockquote segment
          if (endIdx > i) i = endIdx;
          continue;
        case 'pre':
          serializeCodeBlock(node, segments);
          continue;
        default:
          segments.push({
            e: 'par',
            c: serializeChildNodes(node)
          })
      }
    }
  }
  return { document: segments };
}
