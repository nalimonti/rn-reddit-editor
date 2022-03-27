# rn-reddit-editor

Rich text Reddit editor for React Native

## Installation

```sh
npm install rn-reddit-editor
```

## Usage

```js
import { Editor, htmlToRichTextJSON, EditorHandle } from "rn-reddit-editor";

const App = () => {
  const editor = useRef<EditorHandle>();
  const [theme, setTheme] = useState('light');
  const [html, setHtml] = useState<string>();

  const _pickImage = () => {
    // retrieve an image url
    const url = 'image.png';
    // embed the image
    editor?.current?.addImage(url);
  }

  const _submit = () => {
      // convert raw HTML to Reddit richtext JSON
      const richtextJSON = htmlToRichTextJSON(html);
      //...
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
      />
      <Button onPress={_submit}>Submit</Button>
      <Button onPress={_toggleTheme}>Toggle Theme</Button>
    </>
  )
}
```

## Attributions
### Icons
Please abide by the attribution rules according to www.flaticon.com and www.thenounproject.com.
- Bold: Bold icons created by Google - Flaticon (https://www.flaticon.com/free-icons/bold)
- Italic: Italic icons created by Freepik - Flaticon (https://www.flaticon.com/free-icons/italic)
- Strikethrough: Strikethrough text icons created by Freepik - Flaticon (https://www.flaticon.com/free-icons/strikethrough-text)
- Web programming: created by Pixel perfect - Flaticon (https://www.flaticon.com/free-icon/web-programming_2809371?term=code&page=1&position=60&page=1&position=60&related_id=2809371&origin=search#)
- Code: Code icons created by Pixel perfect - Flaticon (https://www.flaticon.com/free-icons/code)
- Quote: Quote icons created by Mayor Icons - Flaticon (https://www.flaticon.com/free-icons/quote)
- Heading: Heading icons created by Md Tanvirul Haque - Flaticon (https://www.flaticon.com/free-icons/heading)
- Superscript: Superscript icons created by Pixel perfect - Flaticon (https://www.flaticon.com/free-icons/superscript)
- Number list: Number icons created by Pixel perfect - Flaticon (https://www.flaticon.com/free-icons/number)
- Bullet list: List icons created by Freepik - Flaticon (https://www.flaticon.com/free-icons/list)
- Eraser: Eraser icons created by Freepik - Flaticon (https://www.flaticon.com/free-icons/eraser)
- Link: Link icons created by Royyan Wijaya - Flaticon (https://www.flaticon.com/free-icons/link)
- Clear format: Clear format icons created by Bharat Icons - Flaticon (https://www.flaticon.com/free-icons/clear-format)
- Photo: Photo icons created by Freepik - Flaticon (https://www.flaticon.com/free-icons/photo)
- Redaction: Redaction by Dan Hetteix from NounProject.com (https://thenounproject.com/icon/redaction-28201/)
  <a href="https://www.flaticon.com/free-icons/code" title="code icons">Code icons created by Pixel perfect - Flaticon</a>

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
