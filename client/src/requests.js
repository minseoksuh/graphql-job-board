const endpointURL = "http://localhost:9000/graphql";

async function graphqlReqeust(query, variables = {}) {
  const response = await fetch(endpointURL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  const responseBody = await response.json();

  if (responseBody.errors) {
    const message = responseBody.errors
      .map((error) => error.message)
      .join("\n");
    throw new Error(message);
  }
  return responseBody.data;
}

export async function loadJobs() {
  const query = `
    {
          jobs {
            id,
            title,
            company{
              id,
              name,
            }
          }
        }`;
  const { jobs } = await graphqlReqeust(query);

  return jobs;
}

export async function loadJob(id) {
  // in order to pass in variables we need to use the "query" keyword
  // operation name JobQuery useful for deubbing
  const query = `
  query JobQuery($id: ID!){
    job(id: $id){
      id,
      title,
      description,
      company{
        id,
        name
              }
    }
  }`;
  const { job } = await graphqlReqeust(query, { id });

  return job;
}

export async function loadCompany(id) {
  const query = `query CompanyQuery($id: ID!){
        company(id: $id){
          id,
          name,
          description,
          jobs {
            id,
            title,
          }
        }
      }`;
  const { company } = await graphqlReqeust(query, { id });

  return company;
}
