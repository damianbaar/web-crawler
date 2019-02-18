import {
  parseHTML,
  getTextFromNode,
  getURLsFromPage,
  parseAnchors
} from "../src/page-parser"

import mockAxios from "axios"
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

test("get label for anchor href", () => {
  const hrefs = getTextFromNode(parseHTML(simpleHREF).childNodes);
  expect(hrefs).toMatchInlineSnapshot(`
Array [
  "Case studies",
]
`)
})

test("get first text child from complex href", () => {
  const hrefs = getTextFromNode(parseHTML(nestedHREFText).childNodes);
  expect(hrefs).toMatchInlineSnapshot(`
Array [
  "Case Study",
  "Delivering an exceptional mortgage customer experience for Allied Irish Bank",
]
`)
})

test("skip duplicates - pointing to the same href", () => {
  const hrefs = parseAnchors(`
    ${simpleHREF}
    ${simpleHREF}
    ${simpleHREF}
  `)

  expect(hrefs).toMatchInlineSnapshot(`
Array [
  Array [
    Array [
      "Case studies",
    ],
    "https://wiprodigital.com/what-we-do#wdwork_cases",
  ],
]
`)
})

const pageA =
  (baseURL: string) => `
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
  </html>
`

const pageC = (baseURL: string) => `
  <html>
  <a href="${baseURL}/pageB">Page B</a>
  </html>
`

const dummyBaseURL = 'https://my-super-cool-domain.com'

const siteMap: Record<string, string> = {
  '/pageA': pageA(dummyBaseURL),
  '/pageB': pageB(dummyBaseURL),
  '/pageC': pageC(dummyBaseURL)
}

test("get all urls from page without domain filtering", () => {
  // @ts-ignore
  mockAxios.get.mockImplementationOnce((url) => {
    const { path } = parseURL(url)
    return Promise.resolve({ data: siteMap[path as string] })
  })

  return getURLsFromPage("https://my-super-cool-domain.com/pageA", false)
    .then(result => expect(result).toMatchSnapshot())
    .catch(() => fail())
})

test("get all urls from page with domain filtering", () => {
  // @ts-ignore
  mockAxios.get.mockImplementationOnce((url) => {
    const { path } = parseURL(url)
    return Promise.resolve({ data: siteMap[path as string] })
  })

  return getURLsFromPage("https://my-super-cool-domain.com/pageA", true)
    .then(result => expect(result).toMatchSnapshot())
    .catch(() => fail())
})

// test("get urls from pages", () =>
