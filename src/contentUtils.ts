import {RichTextJSONSegment} from "./types";
import { DOMParser } from 'xmldom';

const FORMAT_CODES = {
  BOLD: 1,
  ITALIC: 2,
  STRIKE: 8,
  SUPER: 32,
  CODE: 64,
}

type Segment = { text: string; tags: string[] }
type Formats = Array<number[]>;

const serializeChildNodes = (node: ChildNode) => {
  const iterate = (n: any, parts: Segment[], tags: string[]): Segment[] => {
    const href = n.attributes?.getNamedItem('href')?.nodeValue;
    if (n.nodeType === 3 && !!n.nodeValue) {
      parts.push({ text: n.nodeValue, tags: [ ...tags ] });
    }
    const children = Array.from(n.childNodes || []);
    children?.forEach(c => iterate(c, parts, [ ...tags, (c as ChildNode).nodeName, ...(href?.length ? [ `href:${href}` ] : []) ]));
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
  console.log(html)
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
      // node is image or has image child
      if (!!imgNode) {
        const src = (imgNode as Element).attributes?.getNamedItem('src')?.nodeValue,
          assetId = (imgNode as Element).attributes?.getNamedItem('data-asset-id')?.nodeValue,
          caption = (imgNode as Element).attributes?.getNamedItem('data-caption')?.nodeValue;
        if (src && assetId) segments.push({ e: 'img', id: assetId, ...(!!caption?.length ? { c: caption } : {}) })
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

const extractTextParts = (t: string, f: Array<number[]>): { text?: string; sum?: number }[] => {
  const ret = [];
  let str = '', currF: number[]|undefined = f[0], currSum = 0;
  for (let i = 0; i < t.length; i++) {
    const [ sum, start, len ] = currF || [],
      end = currF ? (start + len) - 1 : undefined;
    if (i === t.length - 1) {
      ret.push({ text: str + t[i], sum: currSum })
      continue;
    }
    // beginning of formatted segment
    if (i === start) {
      if (str.length) ret.push({ text: str, sum: currSum });
      str = t[i];
      currSum = sum || 0;
      continue;
    }
    // no formatting for current position, or in middle of formatted segment
    if (!currF || i < start || (end && i < end)) {
      str += t[i];
      continue;
    }
    // end of formatted segment
    str += t[i];
    const nextChar = i + 1 < t.length - 1 ? t[i + 1] : undefined;
    if (nextChar === ' ') {
      str += t[i + 1];
      i++;
    }
    ret.push({ text: str, sum: currSum });
    // remove the current formatting
    f.splice(0, 1);
    currF = f.length ? f[0] : undefined;
    str = '';
    currSum = 0;
  }
  return ret;
}

const appendSpoiler = (doc: Document, container: HTMLElement, node: RichTextJSONSegment) => {
  const { c } = node;
  const spoiler = doc.createElement('spoiler');
  if (Array.isArray(c)) spoiler.textContent = (c || []).map(({ t }) => t).join(' ');
  container.appendChild(spoiler);
}

const deserializeTextNode = (doc: Document, container: HTMLElement, node: RichTextJSONSegment) => {
  const { f, t = '', e, u } = node;
  console.log('deserialize', node)

  if (e === 'link') {
    const a = doc.createElement('a');
    a.textContent = t;
    a.setAttribute('href', u || '');
    container.appendChild(a);
    return;
  }

  if (e === 'spoilertext') return appendSpoiler(doc, container, node);

  if (!Array.isArray(f) || !f.length) {
    container.textContent = t;
    return;
  }

  const textParts = extractTextParts(t, f);

  console.log('textparts', textParts)

  let prevEl: HTMLElement,
    currEl: HTMLElement;
  for (let j = 0; j <= textParts.length - 1; j++) {
    const { text, sum = 0 } = textParts[j];
    if (!sum) {
      currEl = doc.createElement('span');
      currEl.textContent = text || '';
    }
    if (sum === FORMAT_CODES.BOLD) {
      currEl = doc.createElement('strong');
      currEl.textContent = text || '';
    }
    if (sum === FORMAT_CODES.ITALIC) {
      currEl = doc.createElement('em');
      currEl.textContent = text || '';
    }
    if (sum === FORMAT_CODES.STRIKE) {
      currEl = doc.createElement('s');
      currEl.textContent = text || '';
    }
    if (sum === FORMAT_CODES.SUPER) {
      currEl = doc.createElement('sup');
      currEl.textContent = text || '';
    }
    if ([10].indexOf(sum) >= 0) {
      currEl = doc.createElement('s');
      currEl.textContent = text || '';
      if (prevEl?.nodeName === 'em') {
        prevEl.appendChild(currEl);
        continue;
      }
      else {
        const em = doc.createElement('em');
        em.appendChild(currEl);
        container.appendChild(em);
        continue;
      }
    }
    if ([3, 9].indexOf(sum) >= 0) {
      if (sum === 3) {
        currEl = doc.createElement('em');
        currEl.textContent = text || '';
      }
      else if (sum === 9) {
        currEl = doc.createElement('s');
        currEl.textContent = text || '';
      }
      if (prevEl?.nodeName === 'strong') {
        prevEl?.appendChild(currEl);
        continue;
      }
      else {
        const strong = doc.createElement('strong');
        strong.appendChild(currEl);
        container.appendChild(strong);
        continue;
      }
    }
    else if (sum === 33) {
      const sup = doc.createElement('sup'),
        strong = doc.createElement('strong');
      strong.textContent = text || '';
      prevEl = sup;
      sup.appendChild(strong);
      container.appendChild(sup);
      continue;
    }
    else if (sum === 34) {
      const sup = doc.createElement('sup'),
        em = doc.createElement('em');
      em.textContent = text || '';
      sup.appendChild(em);
      container.appendChild(sup);
      continue;
    }
    else if (sum === FORMAT_CODES.CODE) {
      currEl = doc.createElement('code');
      currEl.textContent = text || '';
    }

    if (currEl) {
      container.appendChild(currEl);
      prevEl = currEl;
    }
  }
}

const deserializeJSONSegment = (doc: Document, segment: RichTextJSONSegment) => {
  const { e, c, o } = segment;
  let container: HTMLElement;
  if (e === 'par') container = doc.createElement('p');
  else if (e === 'list') container = doc.createElement(!!o ? 'ol' : 'ul');
  else if (e === 'code') {
    container = doc.createElement('pre');
    if (Array.isArray(c)) container.textContent = c.map(({ t }) => t || '').join('\n') + '\n';
    return container;
  }
  else if (e === 'spoilertext') {
    container = doc.createElement('spoiler');
    if (Array.isArray(c)) container.textContent = c.map(({ t }) => t || '').join(' ');
    return container;
  }
  else if (e === 'h') {
    container = doc.createElement('h1');
    if (Array.isArray(c)) container.textContent = c.map(({ t }) => t || '').join(' ');
    return container;
  }
  else if (e === 'blockquote') {
    container = doc.createElement('span');
    if (Array.isArray(c)) {
      c.forEach(({ c: innerC }) => {
        const blockquote = doc.createElement('blockquote');
        if (Array.isArray(innerC)) {
          innerC.forEach(node => deserializeTextNode(doc, blockquote, node));
        }
        container.appendChild(blockquote);
      });
    }
    return container;
  }
  if (Array.isArray(c) && c.length) {
    for (let j = 0; j <= c.length - 1; j++) {
      const { e: innerE, c: innerC } = c[j];
      if (['text', 'link'].indexOf(innerE) >= 0) {
        deserializeTextNode(doc, container, c[j]);
      }
      else if (innerE === 'li') {
        const li = doc.createElement('li');
        if (Array.isArray(innerC))
          (innerC || []).forEach(({ c }) => {
            if (Array.isArray(c)) (c || []).forEach(node => deserializeTextNode(doc, li, node))
          })
        container.appendChild(li);
      }
      else if (innerE === 'spoilertext') {
        appendSpoiler(doc, container, c[j]);
      }
    }
  }
  console.log(container?.toString());
  return container;
}

export const richTextJSONToHtml = (richTextJSON: RichTextJSONSegment[]) => {
  console.log(richTextJSON);
  console.log(JSON.stringify(richTextJSON))
  const html = new DOMParser().parseFromString('<div></div>', 'text/html');
  for (let i = 0; i <= richTextJSON.length - 1; i++) {
    const { e, c } = richTextJSON[i];
    html.appendChild(deserializeJSONSegment(html, richTextJSON[i]));
  }
  return html.toString().replace('<div xmlns="http://www.w3.org/1999/xhtml"></div>', '');
}
