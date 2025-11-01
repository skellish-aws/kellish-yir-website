/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getNewsletter = /* GraphQL */ `query GetNewsletter($id: ID!) {
  getNewsletter(id: $id) {
    accessLinks {
      nextToken
      __typename
    }
    cardImageUrl
    cardThumbnailUrl
    createdAt
    id
    pdfThumbnailUrl
    pdfUrl
    title
    updatedAt
    year
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetNewsletterQueryVariables,
  APITypes.GetNewsletterQuery
>;
export const getNewsletterAccessLink = /* GraphQL */ `query GetNewsletterAccessLink($id: ID!) {
  getNewsletterAccessLink(id: $id) {
    createdAt
    id
    newsletter {
      cardImageUrl
      cardThumbnailUrl
      createdAt
      id
      pdfThumbnailUrl
      pdfUrl
      title
      updatedAt
      year
      __typename
    }
    newsletterId
    recipient {
      address1
      address2
      city
      createdAt
      email
      firstName
      id
      lastName
      owner
      secondName
      state
      title
      updatedAt
      wantsPaper
      zipcode
      __typename
    }
    recipientId
    uniqueUrlToken
    updatedAt
    used
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetNewsletterAccessLinkQueryVariables,
  APITypes.GetNewsletterAccessLinkQuery
>;
export const getRecipient = /* GraphQL */ `query GetRecipient($id: ID!) {
  getRecipient(id: $id) {
    accessLinks {
      nextToken
      __typename
    }
    address1
    address2
    city
    createdAt
    email
    firstName
    id
    lastName
    owner
    secondName
    state
    title
    updatedAt
    wantsPaper
    zipcode
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetRecipientQueryVariables,
  APITypes.GetRecipientQuery
>;
export const listNewsletterAccessLinks = /* GraphQL */ `query ListNewsletterAccessLinks(
  $filter: ModelNewsletterAccessLinkFilterInput
  $limit: Int
  $nextToken: String
) {
  listNewsletterAccessLinks(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      createdAt
      id
      newsletterId
      recipientId
      uniqueUrlToken
      updatedAt
      used
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListNewsletterAccessLinksQueryVariables,
  APITypes.ListNewsletterAccessLinksQuery
>;
export const listNewsletters = /* GraphQL */ `query ListNewsletters(
  $filter: ModelNewsletterFilterInput
  $limit: Int
  $nextToken: String
) {
  listNewsletters(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      cardImageUrl
      cardThumbnailUrl
      createdAt
      id
      pdfThumbnailUrl
      pdfUrl
      title
      updatedAt
      year
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListNewslettersQueryVariables,
  APITypes.ListNewslettersQuery
>;
export const listRecipients = /* GraphQL */ `query ListRecipients(
  $filter: ModelRecipientFilterInput
  $limit: Int
  $nextToken: String
) {
  listRecipients(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      address1
      address2
      city
      createdAt
      email
      firstName
      id
      lastName
      owner
      secondName
      state
      title
      updatedAt
      wantsPaper
      zipcode
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListRecipientsQueryVariables,
  APITypes.ListRecipientsQuery
>;
