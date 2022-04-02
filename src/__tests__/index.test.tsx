import {htmlToRichTextJSON, richTextJSONToHtml} from "../contentUtils";

describe('richTextJSONToHtml', () => {
  test('Inline styles', () => {
    expect(
      richTextJSONToHtml([{"e":"par","c":[{"e":"text","t":"bold italic tt","f":[[1,0,4],[3,5,6],[9,12,2]]}]}])
    ).toEqual('<p><strong>bold <em>italic </em><s>tt</s></strong></p>')

    expect(
      richTextJSONToHtml([{"e":"par","c":[{"e":"text","t":"bold italic unformatted","f":[[1,0,4],[3,5,6]]}]}])
    ).toEqual('<p><strong>bold <em>italic </em></strong><span>unformatted</span></p>')

    expect(
      richTextJSONToHtml([{"e":"par","c":[{"e":"text","t":"italicsuperstrike","f":[[2,0,6],[34,6,5],[10,11,6]]}]}])
    ).toEqual('<p><em>italic</em><sup><em>super</em></sup><em><s>strike</s></em></p>')
  })

  test('Unordered list', () => {
    expect(
      richTextJSONToHtml([{"e":"par","c":[{"e":"text","t":"blah"}]},{"e":"par","c":[{"e":"text","t":"bold italic","f":[[1,0,4],[3,5,6]]}]},{"e":"list","o":false,"c":[{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"item 1","f":[[3,0,6]]}]}]},{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"item 2"}]}]}]}])
    ).toEqual('<p>blah</p><p><strong>bold <em>italic</em></strong></p><ul><li><strong><em>item 1</em></strong></li><li>item 2</li></ul>')
  })

  test('Inline code', () => {
    expect(
      richTextJSONToHtml([{"e":"par","c":[{"e":"text","t":"Boldsuper inline code","f":[[1,0,4],[33,4,5],[64,10,11]]}]}])
    ).toEqual('<p><strong>Bold</strong><sup><strong>super </strong></sup><code>inline code</code></p>')
  })

  test('Code block', () => {
    expect(
      richTextJSONToHtml([{"e":"par","c":[{"e":"text","t":"First paragraph"}]},{"e":"code","c":[{"e":"raw","t":"const a = 1;"},{"e":"raw","t":"const b = 2;"},{"e":"raw","t":"const c = a + b;"}]}])
    ).toEqual('<p>First paragraph</p><pre>const a = 1;\n' +
      'const b = 2;\n' +
      'const c = a + b;\n' +
      '</pre>')
  })

  test('Inline link', () => {
    expect(
      richTextJSONToHtml([{"e":"par","c":[{"e":"text","t":"text with "},{"e":"link","t":"inline link","u":"https://www.google.com"}]}])
    ).toEqual('<p>text with <a href="https://www.google.com">inline link</a></p>')
  })

  test('Ordered list w/ inline link', () => {
    expect(
      richTextJSONToHtml([{"e":"list","c":[{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"item 1"}]}]},{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"item 2 "},{"e":"link","t":"with link","u":"https://www.google.com"}]}]}],"o":true}])
    ).toEqual('<ol><li>item 1</li><li>item 2 <a href="https://www.google.com">with link</a></li></ol>')
  })

  test('Inline spoiler', () => {
    expect(
      richTextJSONToHtml([{"e":"par","c":[{"e":"text","t":"text with "},{"e":"spoilertext","c":[{"e":"text","t":"inline spoiler"}]}]}])
    ).toEqual('<p>text with <spoiler>inline spoiler</spoiler></p>')

    expect(
      richTextJSONToHtml([{"e":"list","c":[{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"item 1"}]}]},{"e":"li","c":[{"e":"par","c":[{"e":"spoilertext","c":[{"e":"text","t":"spoiler item"}]}]}]}],"o":false}])
    ).toEqual('<ul><li>item 1</li><li><spoiler>spoiler item</spoiler></li></ul>')
  })

  test('Blockquote', () => {
    expect(
      richTextJSONToHtml([{"e":"blockquote","c":[{"e":"par","c":[{"e":"text","t":"block"}]},{"e":"par","c":[{"e":"text","t":"quote"}]}]}])
    ).toEqual('<span><blockquote>block</blockquote><blockquote>quote</blockquote></span>')

    expect(
      richTextJSONToHtml([{"e":"blockquote","c":[{"e":"par","c":[{"e":"text","t":"block"}]},{"e":"par","c":[{"e":"text","t":"quote Bold","f":[[1,6,4]]}]}]}])
    ).toEqual('<span><blockquote>block</blockquote><blockquote><span>quote </span><strong>Bold</strong></blockquote></span>')
  })

  test('Header', () => {
    expect(
      richTextJSONToHtml([{"e":"h","l":1,"c":[{"e":"raw","t":"Header"}]},{"e":"par","c":[{"e":"text","t":"italic","f":[[2,0,6]]}]}])
    ).toEqual('<h1>Header</h1><p><em>italic</em></p>')
  })
})

describe('htmlToRichTextJSON', () => {
  test('Inline spoiler', () => {
    expect(
      htmlToRichTextJSON('<p>Inline <spoiler>with spoiler</spoiler></p>')
    ).toEqual({"document":[{"e":"par","c":[{"e":"text","t":"Inline "},{"e":"spoilertext","c":[{"e":"text","t":"with spoiler"}]}]}]})
  })

  test('Unordered list', () => {
    expect(
      htmlToRichTextJSON('<ul><li>Item 1</li><li><strong>Bold Item 2</strong></li></ul>')
    ).toEqual({"document":[{"e":"list","c":[{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"Item 1"}]}]},{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"Bold Item 2","f":[[1,0,11]]}]}]}],"o":false}]})
  })

  test('Codeblock & blockquote', () => {
    expect(
      htmlToRichTextJSON('<h1>Header text</h1><pre class="ql-syntax" spellcheck="false">Codeblock text\n' +
        '</pre><blockquote>Block</blockquote><blockquote>quote</blockquote>')
    ).toEqual({"document":[{"e":"h","l":1,"c":[{"e":"raw","t":"Header text"}]},{"e":"code","c":[{"e":"raw","t":"Codeblock text"}]},{"e":"blockquote","c":[{"e":"par","c":[{"e":"text","t":"Block"}]},{"e":"par","c":[{"e":"text","t":"quote"}]}]}]})
  })

  test('Inline link', () => {
    expect(
      htmlToRichTextJSON('<p>Text with <a href="https://www.google.com" rel="noopener noreferrer" target="_blank">inline link</a> works</p>')
    ).toEqual({"document":[{"e":"par","c":[{"e":"text","t":"Text with "},{"e":"link","t":"inline link","u":"https://www.google.com"},{"e":"text","t":" works"}]}]})
  })

  test('Blockquote with nested styles', () => {
    expect(
      htmlToRichTextJSON('<blockquote>block line 1</blockquote><blockquote><strong>bold <em>italic <s>strike</s></em></strong><sup>super</sup></blockquote>')
    ).toEqual({"document":[{"e":"blockquote","c":[{"e":"par","c":[{"e":"text","t":"block line 1"}]},{"e":"par","c":[{"e":"text","t":"bold italic strikesuper","f":[[1,0,4],[3,5,6],[11,12,6],[32,18,5]]}]}]}]})
  })

  test('Lists', () => {
    expect(
      htmlToRichTextJSON('<ul><li>ul 1</li><li>ul 2 <code>inline code</code></li></ul><ol><li>ol 1</li><li>ol 2</li></ol>')
    ).toEqual({"document":[{"e":"list","c":[{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"ul 1"}]}]},{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"ul 2 inline code","f":[[64,5,11]]}]}]}],"o":false},{"e":"list","c":[{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"ol 1"}]}]},{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"ol 2"}]}]}],"o":true}]})
  })

  test('Codeblock', () => {
    expect(
      htmlToRichTextJSON('<p><spoiler>Don\'t spoil it for me</spoiler></p><pre class="ql-syntax" spellcheck="false">function main()\n' +
        '{\n' +
        '    console.log("hello world");\n' +
        '}\n' +
        '</pre>')
    ).toEqual({"document":[{"e":"par","c":[{"e":"spoilertext","c":[{"e":"text","t":"Don't spoil it for me"}]}]},{"e":"code","c":[{"e":"raw","t":"function main()"},{"e":"raw","t":"{"},{"e":"raw","t":"    console.log(\"hello world\");"},{"e":"raw","t":"}"}]}]})
  })

  test('Image', () => {
    const rtJSON = htmlToRichTextJSON('<p>Ubhjkn</p><p><br></p><img class="image-blot" src="http://rayleehomes.com/wp-content/uploads/2020/09/Raylee_DreamHome_Images2.jpg" data-asset-id="nh8qumjnmbq81" data-caption="My awesome caption!" data-src="http://rayleehomes.com/wp-content/uploads/2020/09/Raylee_DreamHome_Images2.jpg"><p><br></p>'),
      imgSegment = rtJSON.document?.find(({ e }) => e === 'img');
    expect(!!imgSegment).toBeTruthy();
    expect(imgSegment?.id).toEqual('nh8qumjnmbq81');
    expect(imgSegment?.c).toEqual('My awesome caption!');
  })

  test('Bold & italic', () => {
    expect(
      htmlToRichTextJSON('<p><strong>bold <em>italic</em></strong></p>')
    ).toEqual({"document":[{"e":"par","c":[{"e":"text","t":"bold italic","f":[[1,0,4],[3,5,6]]}]}]})
  })
})
