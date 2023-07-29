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
    _id
    name
    database
    version
    author
    uuid
    schemas {
      _id
      functions
      fields
      name
      types
      arrays
      requires
      relations
      relationFields
    }
    triggers {
      delay
      _id
      name
      when
      trigger
      type
    }
    services {
      _id
    }
  }
}
`