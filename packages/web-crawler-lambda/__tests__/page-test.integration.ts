import request from 'supertest'

const pageToTest = 'https://www.w3schools.com/'

test('test w3 page', () =>
  // TODO this path should comes from outside
  request('localhost:8080')
    .get(`/get-site-map?page=${pageToTest}`)
    .expect(200)
    .then(response => {
      console.log(response.body)
      expect(response.body).not.toBeNull()
      expect(response.body).toMatchSnapshot()
    }
    )
    .catch((e: Error) => fail(e))
)