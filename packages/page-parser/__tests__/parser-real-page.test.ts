import {
  parseHTML,
  getTextFromNode,
  getURLsFromPage,
  parseAnchors,
  traversePage,
  drawTree,
  printSiteMap
} from '../src/page-parser'

jest.setTimeout(100000)

test('testing real page', () => {
  const baseURL = 'https://wiprodigital.com/'

  return printSiteMap(baseURL)
    .then(result => expect(result).toMatchSnapshot())
})