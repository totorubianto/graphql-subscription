'use strict';

const fs = require('fs');
const path = require('path');
const EasyGraphQLTester = require('easygraphql-tester');

const schemaCode = fs.readFileSync(
  path.join(__dirname, '..', 'schema.gql'),
  'utf8'
);

describe('Test your GraphQL Schema', () => {
  let tester;
  beforeAll(() => {
    tester = new EasyGraphQLTester(schemaCode);
  });

  describe('Queries', () => {
    test('should get every message from GraphQL', () => {
      const query = `
                query getMessages{
                    messages{
                        content
                        user_id_to
                        user_id_from
                        created_at
                    }
                }
            `;

      tester.test(true, query);
    });
  });
});
