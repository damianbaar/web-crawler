jest.mock('axios')

import {
  parseHTML,
  getTextFromNode,
  getURLsFromPage,
  parseAnchors,
  traversePage,
  drawTree,
  printSiteMap
} from '../src/page-parser'

import mockAxios from 'axios'
import { parse as parseURL } from 'url'

const simpleHREF = `
  <a class="wd-navbar-nav-elem-link wd-nav-elem-link" href="https://wiprodigital.com/what-we-do#wdwork_cases">Case studies</a>
`

const nestedHREFText = `
<a class="wd-navbar-nav-elem-link wd-nav-elem-link" href="https://wiprodigital.com/cases/delivering-an-exceptional-mortgage-customer-experience-for-allied-irish-bank/">
  <div class="caItemOvrLay">
    <div class="caItemTxt">
      <p>
        <span class="caItemCatg">Case Study</span>
      </p>
      <p class="caItemHeading-cntnr">
        <span class="caItemHeading">
          Delivering an exceptional mortgage customer experience for Allied Irish Bank                                            
        </span>
      </p>
    </div>
  </div>
</a>
`

test('get label for anchor href', () => {
  const hrefs = getTextFromNode(parseHTML(simpleHREF).childNodes)
  expect(hrefs).toMatchInlineSnapshot(`
Array [
  "Case studies",
]
`)
})

test('get first text child from complex href', () => {
  const hrefs = getTextFromNode(parseHTML(nestedHREFText).childNodes)
  expect(hrefs).toMatchInlineSnapshot(`
Array [
  "Case Study",
  "Delivering an exceptional mortgage customer experience for Allied Irish Bank",
]
`)
})

test('skip duplicates - pointing to the same href', () => {
  const hrefs = parseAnchors(`
    ${simpleHREF}
    ${simpleHREF}
    ${simpleHREF}
  `)

  expect(hrefs).toMatchInlineSnapshot(`
Array [
  Object {
    "labels": Array [
      "Case studies",
    ],
    "url": "https://wiprodigital.com/what-we-do#wdwork_cases",
  },
]
`)
})

const pageA = (baseURL: string) => `
  <html>
  <a href="${baseURL}/pageB">Page B</a>
  <a href="${baseURL}/pageC">Page C</a>
  <a href="${baseURL}/pageD">Page D</a>
  ${simpleHREF}
  ${nestedHREFText}
  <a href="https://some-other-domain">some other domain</a>
  </html>
`

const pageB = (baseURL: string) => `
  <html>
  <a href="${baseURL}/pageC">Page C</a>
  <a href="${baseURL}/pageA">Page A</a>
  <a href="${baseURL}/pageE">Page E</a>
  </html>
`

const pageC = (baseURL: string) => `
  <html>
  <a href="${baseURL}/pageF">Page F</a>
  </html>
`

const pageE = (baseURL: string) => `
  <html>
  <a href="${baseURL}/pageG">Page G</a>
  </html>
`

const pageG = (baseURL: string) => `
  <html>
  <a href="${baseURL}/pageX">Page X</a>
  </html>
`

const dummyBaseURL = 'https://my-super-cool-domain.com'

const siteMap: Record<string, string> = {
  '/pageA': pageA(dummyBaseURL),
  '/pageB': pageB(dummyBaseURL),
  '/pageC': pageC(dummyBaseURL),
  '/pageE': pageE(dummyBaseURL),
  '/pageG': pageG(dummyBaseURL)
}

test('get all urls from page without domain filtering', () => {
  // @ts-ignore
  mockAxios.get.mockImplementationOnce(url => {
    const { path } = parseURL(url)
    return Promise.resolve({ data: siteMap[path as string] })
  })

  return getURLsFromPage('https://my-super-cool-domain.com/pageA', false)
    .then(result => expect(result).toMatchSnapshot())
    .catch(() => fail())
})

test('get all urls from page with domain filtering', () => {
  // @ts-ignore
  mockAxios.get.mockImplementationOnce(url => {
    const { path } = parseURL(url)
    return Promise.resolve({ data: siteMap[path as string] })
  })

  return getURLsFromPage('https://my-super-cool-domain.com/pageA', true)
    .then(result => expect(result).toMatchSnapshot())
    .catch(() => fail())
})

test('traverse dummy page', () => {
  // @ts-ignore
  mockAxios.get.mockImplementation(url => {
    const { path } = parseURL(url)
    return new Promise(res =>
      setTimeout(() => res({ data: siteMap[path as string] }), 50)
    )
  })

  return traversePage('https://my-super-cool-domain.com/pageA').then(result => {
    // @ts-ignore
    mockAxios.get.mockClear()
    expect(result[`${dummyBaseURL}/pageX`]).not.toBeNull()
    expect(result).toMatchSnapshot()
  })
})

test('print sitemap', () => {
  // @ts-ignore
  mockAxios.get.mockImplementation(url => {
    const { path } = parseURL(url)
    return Promise.resolve({ data: siteMap[path as string] })
  })

  const baseURL = 'https://my-super-cool-domain.com/pageA'
  return traversePage(baseURL)
    .then(drawTree(baseURL))
    .then(result => expect(result).toMatchSnapshot())
})

// with circular reference
const pageC2 = (baseURL: string) => `
  <html>
  <a href="${baseURL}/pageB">Page B</a>
  </html>
`

const pageB2 = (baseURL: string) => `
  <html>
  <a href="${baseURL}/pageA">Page A</a>
  </html>
`
const siteMapCircular: Record<string, string> = {
  '/pageA': pageC2(dummyBaseURL),
  '/pageB': pageB2(dummyBaseURL)
}

test('print sitemap with circular link', () => {
  // @ts-ignore
  mockAxios.get.mockImplementation(url => {
    const { path } = parseURL(url)
    return Promise.resolve({ data: siteMapCircular[path as string] })
  })
  const baseURL = 'https://my-super-cool-domain.com/pageA'
  return printSiteMap(baseURL)
    .then(result => expect(result).toMatchSnapshot())
})

// TODO add test against 404
// TODO add test against checking host -> there were wrong used indexOf which is treated as referring url for twitter and linkedin
