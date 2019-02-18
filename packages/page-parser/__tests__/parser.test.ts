import {
  parseHTML,
  getTextFromNode,
  getURLsFromPage,
  parseAnchors
} from "../src/page-parser";

const pageA = `
<html>
<a href="/pageB" />
</html>
`;

const pageB = `
<html>
</html>
`;

const simpleHREF = `
  <a class="wd-navbar-nav-elem-link wd-nav-elem-link" href="https://wiprodigital.com/what-we-do#wdwork_cases">Case studies</a>
`;

const nestedHREFText = `
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
</div>,
`;

test("get label for anchor href", () => {
  const hrefs = getTextFromNode(parseHTML(simpleHREF).childNodes);
  expect(hrefs).toMatchInlineSnapshot(`
Array [
  "Case studies",
]
`);
});

test("get first text child from complex href", () => {
  const hrefs = getTextFromNode(parseHTML(nestedHREFText).childNodes);
  expect(hrefs).toMatchInlineSnapshot(`
Array [
  "Case Study",
  "Delivering an exceptional mortgage customer experience for Allied Irish Bank",
]
`);
});

test("skip duplicates - pointing to the same href", () => {
  const hrefs = parseAnchors(`
    ${simpleHREF}
    ${simpleHREF}
    ${simpleHREF}
  `);

  expect(hrefs).toMatchInlineSnapshot(`
Array [
  Array [
    Array [
      "Case studies",
    ],
    "https://wiprodigital.com/what-we-do#wdwork_cases",
  ],
]
`);
});

test("get all urls from pages", () =>
  getURLsFromPage("https://wiprodigital.com/")
    .then(result => {
      expect(result).toMatchSnapshot();
    })
    .catch(() => fail()));
