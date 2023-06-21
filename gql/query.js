import { gql } from 'graphql-request'

export const projects_query = gql`
query GetUser {
  getUser {
    projects {
      uuid
      name
    }
  }
}
`

export const project_query = gql`
query GetProject($getProjectId: ID!) {
  getProject(id: $getProjectId) {
    uuid
    name
    database
    version
    services
    author
    schemas {
      _id
      functions
      fields
      name
      types
      arrays
      requires
      relations
    }
    triggers {
      delay
      id
      name
      when
      trigger
      type
    }
  }
}
`