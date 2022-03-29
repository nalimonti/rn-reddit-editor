import {RichTextJSONSegment} from "./types";
import { DOMParser } from 'xmldom';

const FORMAT_CODES = {
  BOLD: 1,
  ITALIC: 2,
  STRIKE: 8,
  SUPER: 32,
  CODE: 64,
}

const _isSpoiler = (node: Element) => {
  const styles = node.attributes?.getNamedItem('style')?.nodeValue ?? '';
  return (styles.includes(`color: white`) && styles.includes(`background-color: black`))
    || (styles.includes(`color: black`) && styles.includes(`background-color: white`));
}

type Segment = { text: string; tags: string[] }
type Formats = Array<number[]>;

const serializeChildNodes = (node: ChildNode) => {
  const iterate = (n: any, parts: Segment[], tags: string[]): Segment[] => {
    //TODO better way to handle this?
    const isSpoiler = _isSpoiler(n);
    const href = n.attributes?.getNamedItem('href')?.nodeValue;
    if (n.nodeType === 3 && !!n.nodeValue) {
      parts.push({ text: n.nodeValue, tags: [ ...tags ] });
    }
    const children = Array.from(n.childNodes || []);
    children?.forEach(c => iterate(c, parts, [ ...tags, (c as ChildNode).nodeName, ...(isSpoiler ? [ 'spoiler' ] : []), ...(href?.length ? [ `href:${href}` ] : []) ]));
    return parts;
  }
  const segments = iterate(node, [], [ node.nodeName ]),
    ret: RichTextJSONSegment[] = [];
  let t = '', f: Formats = [];
  segments.forEach(({ text, tags }) => {
    if (tags.includes('a')) {
      if (t.length) ret.push({ e: 'text', t, ...(f.length ? { f: [ ...f ] } : {}) });
      const href = tags.find(t => t.includes('href:'))?.replace('href:', '');
      ret.push({ e: 'link', t: text, u: href });
      t = '';
      f = [];
      return;
    }
    if (tags.includes('spoiler')) {
      if (t.length) ret.push({ e: 'text', t });
      ret.push({ e: 'spoilertext', c: [ { e: 'text', t: text } ] });
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
  if (t.length) ret.push({ e: 'text', t, ...(f.length ? { f } : {}) });
  return ret;
}

const serializeCodeBlock = (node: ChildNode, segments: RichTextJSONSegment[]) => {
  const codeText = node.childNodes.item(0).nodeValue;
  if (codeText?.length) {
    segments.push({
      e: 'code',
      c: codeText.split(/\n|\r/).filter(x => !!x.length).map(t => ({ e: 'raw', t }))
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

export const htmlToRichTextJSON = (html: string) => {
  console.log('html', html);
  const parsedDoc = html?.length ? new DOMParser().parseFromString(html, 'text/html') : undefined;
  const segments: RichTextJSONSegment[] = [];
  const nodes = parsedDoc?.childNodes;
  if (nodes?.length) {
    for (let i = 0; i <= nodes.length - 1; i++) {
      const node = nodes.item(i),
        type = node.nodeName,
        imgNode = type === 'img'
          ? node
          : Array.from(node.childNodes || []).find(({ nodeName }) => nodeName === 'img');

      if (!!imgNode) {
        const src = (imgNode as Element).attributes?.getNamedItem('src')?.nodeValue,
          assetId = (imgNode as Element).attributes?.getNamedItem('data-asset-id')?.nodeValue,
          caption = (imgNode as Element).attributes?.getNamedItem('data-caption')?.nodeValue;
        if (src && assetId) segments.push({ e: 'img', id: assetId, c: caption || '' })
        continue;
      }

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

export const isValidURL = (str: string) => {
  let url;
  try { url = new URL(str); } catch (_) { return false; }
  return /https?/.test(url.protocol);
}
