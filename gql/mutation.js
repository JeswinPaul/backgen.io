import { gql } from 'graphql-request'

export const login_mutation = gql`
    mutation OnLogin($login: LoginInput) {
    onLogin(login: $login)
}`