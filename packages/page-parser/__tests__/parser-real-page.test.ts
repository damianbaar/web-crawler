import {
  printSiteMap,
  getURLsFromPage,
} from '../src/page-parser'

jest.setTimeout(30000)

test('testing real page', () => {
  const baseURL = 'https://www.w3schools.com/'

  return printSiteMap(baseURL)
    .then(result => expect(result).toMatchSnapshot())
})