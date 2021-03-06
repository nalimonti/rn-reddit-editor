# rn-reddit-editor

Rich text Reddit editor for React Native

Built on top of the excellent [`react-native-cn-quill`](https://www.npmjs.com/package/react-native-cn-quill) package.
##NOTE: This is a work in progress!

## Installation

```sh
npm install rn-reddit-editor
```
or
```sh
yarn add rn-reddit-editor
```

##Editor Props
`theme`

Theme applied to the editor and toolbar

| Type                  | Required |
|-----------------------|----------|
| `'dark'` or `'light'` | Yes      |

-----

`pickImage`

Function invoked when user presses on the toolbar image icon.
It is up to you to handle image selection.

| Type         | Required |
|--------------|----------|
| `() => void` | No       |

-----

`editorProps`

[`react-native-cn-quill`](https://www.npmjs.com/package/react-native-cn-quill) editor props

| Type                                                                                                     | Required |
|----------------------------------------------------------------------------------------------------------|----------|
| [`EditorProps`](https://github.com/imnapo/react-native-cn-quill/blob/master/src/editor/quill-editor.tsx) | No       |

----

`setHtml`

Callback invoked when editor's HTML has changed

| Type                      | Required |
|---------------------------|----------|
| `(html: string) => void`  | Yes      |

----

`accessToken`

Reddit access token. Required if you want to allow embedded images.
If this property is not specified, the toolbar will not include an image button.

| Type     | Required |
|----------|----------|
| `string` | No       |

---

##Editor Methods

`addImage(url: string, caption?: string): Promise<any>`

Embeds an image into the editor HTML.
This should generally be invoked from within the `pickImage` callback.

----

`focus()`

Focuses the editor

----

`blur()`

Blurs the editor

----

`getContents(): Promise<any>`

Returns the inner Quill JSON content

----

`dangerouslyPasteHTML(html: string): Promise<void>`

Pastes the specified HTML into the editor

----


## Usage

```js
import { Editor, htmlToRichTextJSON, EditorHandle } from "rn-reddit-editor";

const App = () => {
  const editor = useRef<EditorHandle>();
  const [theme, setTheme] = useState('light');
  const [html, setHtml] = useState<string>();

  const _pickImage = async () => {
    // retrieve an image url
    const url = 'image.png',
        caption = 'My awesome caption!';
    // embed the image in the markup
    await editor?.current?.addImage(url, caption);
  }

  const _submit = async () => {
      // convert raw HTML to Reddit richtext JSON
      const richtextJSON = htmlToRichTextJSON(html);
      const formData = new FormData();
      // add richtext JSON to request body
      formData.append('richtext_json', JSON.stringify(richtextJSON));
      // ...
      await submitComment(formData);
  }

  const _toggleTheme = () =>
    setTheme(theme === 'light' ? 'dark' : 'light')

  return (
    <>
      <Editor
        theme={theme}
        ref={editor}
        pickImage={_pickImage}
        setHtml={setHtml}
        accessToken="<reddit_access_token>"
      />
      <Button onPress={_submit}>Submit</Button>
      <Button onPress={_toggleTheme}>Toggle Theme</Button>
    </>
  )
}
```

## Attributions
### Icons
Please adhere to the attribution rules according to www.flaticon.com and www.thenounproject.com.
- Bold: https://www.flaticon.com/free-icon/bold_114304
- Italic: https://www.flaticon.com/premium-icon/italics_2824288
- Strikethrough: https://www.flaticon.com/premium-icon/strikethrough_2209539
- Code block: https://www.flaticon.com/free-icon/code_984196
- Code: https://www.flaticon.com/free-icon/coding_711284
- Quote: https://www.flaticon.com/premium-icon/quote_4338295
- Heading: https://www.flaticon.com/premium-icon/heading_4662543
- Superscript: https://www.flaticon.com/premium-icon/superscript_4662634
- Number list: https://thenounproject.com/icon/number-list-4161243/
- Bullet list: https://thenounproject.com/icon/list-1247047/
- Eraser: https://www.flaticon.com/premium-icon/eraser_2708461
- Link: https://thenounproject.com/icon/link-2805275/
- Clear format: https://thenounproject.com/icon/text-remove-format-120485/
- Image: https://thenounproject.com/icon/image-777906/
- Hide: https://www.flaticon.com/premium-icon/hidden_3287898
- Close: https://www.flaticon.com/free-icon/close_2089733
## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
