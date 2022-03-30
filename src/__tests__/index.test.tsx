import {htmlToRichTextJSON} from "../contentUtils";

describe('htmlToRichTextJSON', () => {
  test('Inline spoiler', () => {
    expect(
      htmlToRichTextJSON('<p>Inline <span style="color: white; background-color: black;">with spoiler</span></p>')
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
      htmlToRichTextJSON('<p><span style="color: white; background-color: black;">Don\'t spoil it for me</span></p><pre class="ql-syntax" spellcheck="false">function main()\n' +
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
})
