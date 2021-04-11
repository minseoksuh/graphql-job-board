import { getAccessToken, isLoggedIn } from "./auth";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "apollo-boost";
import gql from "graphql-tag";

const endpointURL = "http://localhost:9000/graphql";

const authLink = new ApolloLink((operation, forward) => {
  if (isLoggedIn()) {
    // request.headers["authorization"] = `Bearer ` + getAccessToken();
    operation.setContext({
      headers: {
        authorization: `Bearer ` + getAccessToken(),
      },
    });
  }
  return forward(operation);
});

const client = new ApolloClient({
  link: ApolloLink.from([authLink, new HttpLink({ uri: endpointURL })]),
  cache: new InMemoryCache(),
});

const jobsQuery = gql`
  query JobsQuery {
    jobs {
      id
      title
      company {
        id
        name
      }
    }
  }
`;

export async function loadJobs() {
  const {
    data: { jobs },
  } = await client.query({ query: jobsQuery, fetchPolicy: "no-cache" });

  return jobs;
}

const jobDetailFragment = gql`
  fragment JobDetail on Job {
    id
    title
    description
    company {
      id
      name
    }
  }
`;

// in order to pass in variables we need to use the "query" keyword
// operation name JobQuery useful for deubbing
const jobQuery = gql`
  query JobQuery($id: ID!) {
    job(id: $id) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

export async function loadJob(id) {
  const {
    data: { job },
  } = await client.query({ query: jobQuery, variables: { id } });
  return job;
}

const createJobMutation = gql`
  mutation CreateJob($input: CreateJobInput) {
    job: createJob(input: $input) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

export async function createJob(input) {
  const {
    data: { job },
  } = await client.mutate({
    mutation: createJobMutation,
    variables: { input },
    update: (cache, { data }) => {
      cache.writeQuery({
        query: jobQuery,
        variables: { id: data.job.id },
        data,
      });
    },
  });

  return job;
}

const companyQuery = gql`
  query CompanyQuery($id: ID!) {
    company(id: $id) {
      id
      name
      description
      jobs {
        id
        title
      }
    }
  }
`;

export async function loadCompany(id) {
  const {
    data: { company },
  } = await client.query({ query: companyQuery, variables: { id } });

  return company;
}

// async function graphqlReqeust(query, variables = {}) {
//   const request = {
//     method: "POST",
//     headers: {
//       "content-type": "application/json",
//     },
//     body: JSON.stringify({
//       query,
//       variables,
//     }),
//   };
//   if (isLoggedIn()) {
//     request.headers["authorization"] = `Bearer ` + getAccessToken();
//   }
//   const response = await fetch(endpointURL, request);
//   const responseBody = await response.json();

//   if (responseBody.errors) {
//     const message = responseBody.errors
//       .map((error) => error.message)
//       .join("\n");
//     throw new Error(message);
//   }
//   return responseBody.data;
// }
