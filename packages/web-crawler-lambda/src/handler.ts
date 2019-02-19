import { APIGatewayProxyHandler } from "aws-lambda"
import { printSiteMap } from 'page-parser'

export const getSiteMap: APIGatewayProxyHandler = async (event, context) => {
  const { page } = event.queryStringParameters || { page: 'https://wiprodigital.com' }
  const siteMap = await printSiteMap(page, { concurrency: 10 })
  return {
    statusCode: 200,
    body: JSON.stringify(siteMap, null, 2),
  };
};
