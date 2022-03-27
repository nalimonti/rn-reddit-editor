import {serializeQuillContent} from "../contentUtils";

describe('serializeQuillContent', () => {
  test('case 1', () => {
    expect(serializeQuillContent(
      [{"attributes":{"bold":true},"insert":"Bold "},{"attributes":{"italic":true,"bold":true},"insert":"Bold italic "},{"attributes":{"strike":true,"italic":true,"bold":true},"insert":"w/ strikethru"},{"insert":" "},{"attributes":{"color":"crimson","background":"white","code":true},"insert":"inline code"},{"insert":"\n"}]
    )).toEqual(
      {"document":[{"e":"par","c":[{"e":"text","t":"Bold Bold italic w/ strikethru inline code","f":[[1,0,4],[3,5,11],[11,17,13],[64,31,11]]}]}]}
    )
  })

  test('case 2', () => {
    expect(serializeQuillContent(
      [{"insert":"Heading"},{"attributes":{"header":1},"insert":"\n"},{"attributes":{"bold":true},"insert":"Item 1"},{"attributes":{"list":"ordered"},"insert":"\n"},{"insert":"Item 2"},{"attributes":{"list":"ordered"},"insert":"\n"}],
      undefined,
      '<h1>Header</h1><ol><li><strong>Item 1</strong></li><li>Item 2</li></ol>'
    )).toEqual(
      {"document":[{"e":"h","l":1,"c":[{"e":"raw","t":"Heading"}]},{"e":"list","c":[{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"Item 1","f":[[1,0,6]]}]}]},{"e":"li","c":[{"e":"par","c":[{"e":"text","t":"Item 2"}]}]}],"o":true}]}
    )
  })
})
