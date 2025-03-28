import "dotenv/config";
import fs from "node:fs";

// --- Configuration ---
const URL = process.env.VITE_PUBLIC_API_URL;
const AUTH_ENDPOINT = `${URL}/auth/token`;
const GRAPHQL_ENDPOINT = `${URL}/graphql`;

const OUTPUT_JSON_FILE = "schema.json";

// The standard GraphQL introspection query
const introspectionQuery = `
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      ...FullType
    }
    directives {
      name
      description
      locations
      args {
        ...InputValue
      }
    }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args {
      ...InputValue
    }
    type {
      ...TypeRef
    }
    isDeprecated
    deprecationReason
  }
  inputFields {
    ...InputValue
  }
  interfaces {
    ...TypeRef
  }
  enumValues(includeDeprecated: true) {
    name
    description
    isDeprecated
    deprecationReason
  }
  possibleTypes {
    ...TypeRef
  }
}

fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}`;

async function getAuthToken() {
  console.log("Obtaining auth token...");

  try {
    // This is a common pattern, but you may need to adjust based on your API's auth mechanism
    const response = await fetch(AUTH_ENDPOINT, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Auth request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Extract the token from the response - adjust this based on your API's response structure
    // Common patterns include: data.token, data.access_token, data.authToken, etc.
    const token = data.token;

    if (!token) {
      throw new Error("No token found in auth response");
    }

    console.log("Auth token obtained successfully");
    return token;
  } catch (error) {
    console.error("Error obtaining auth token:", error);
    throw error;
  }
}

async function fetchGraphQLSchema(token) {
  console.log("Fetching GraphQL schema...");

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Adjust auth header format if needed
      },
      body: JSON.stringify({ query: introspectionQuery }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    console.log("Schema fetched successfully");
    return result.data;
  } catch (error) {
    console.error("Error fetching GraphQL schema:", error);
    throw error;
  }
}

async function saveSchemaToFile(schemaData) {
  console.log(`Saving schema to ${OUTPUT_JSON_FILE}...`);

  try {
    // Save the raw JSON schema
    fs.writeFileSync(
      OUTPUT_JSON_FILE,
      JSON.stringify(schemaData, null, 2),
      "utf8"
    );
    console.log(`Schema saved to ${OUTPUT_JSON_FILE}`);
  } catch (error) {
    console.error("Error saving schema:", error);
    throw error;
  }
}

async function main() {
  try {
    // Step 1: Get auth token
    const token = await getAuthToken();

    // Step 2: Use token to fetch GraphQL schema
    const schemaData = await fetchGraphQLSchema(token);

    // Step 3: Save schema to file
    await saveSchemaToFile(schemaData);

    console.log("Process completed successfully!");
  } catch (error) {
    console.error("Process failed:", error);
    process.exit(1);
  }
}

main();
