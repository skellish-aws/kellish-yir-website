/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateNewsletter = /* GraphQL */ `subscription OnCreateNewsletter(
  $filter: ModelSubscriptionNewsletterFilterInput
) {
  onCreateNewsletter(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateNewsletterSubscriptionVariables,
  APITypes.OnCreateNewsletterSubscription
>;
export const onCreateNewsletterAccessLink = /* GraphQL */ `subscription OnCreateNewsletterAccessLink(
  $filter: ModelSubscriptionNewsletterAccessLinkFilterInput
) {
  onCreateNewsletterAccessLink(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateNewsletterAccessLinkSubscriptionVariables,
  APITypes.OnCreateNewsletterAccessLinkSubscription
>;
export const onCreateRecipient = /* GraphQL */ `subscription OnCreateRecipient(
  $filter: ModelSubscriptionRecipientFilterInput
  $owner: String
) {
  onCreateRecipient(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateRecipientSubscriptionVariables,
  APITypes.OnCreateRecipientSubscription
>;
export const onDeleteNewsletter = /* GraphQL */ `subscription OnDeleteNewsletter(
  $filter: ModelSubscriptionNewsletterFilterInput
) {
  onDeleteNewsletter(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteNewsletterSubscriptionVariables,
  APITypes.OnDeleteNewsletterSubscription
>;
export const onDeleteNewsletterAccessLink = /* GraphQL */ `subscription OnDeleteNewsletterAccessLink(
  $filter: ModelSubscriptionNewsletterAccessLinkFilterInput
) {
  onDeleteNewsletterAccessLink(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteNewsletterAccessLinkSubscriptionVariables,
  APITypes.OnDeleteNewsletterAccessLinkSubscription
>;
export const onDeleteRecipient = /* GraphQL */ `subscription OnDeleteRecipient(
  $filter: ModelSubscriptionRecipientFilterInput
  $owner: String
) {
  onDeleteRecipient(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteRecipientSubscriptionVariables,
  APITypes.OnDeleteRecipientSubscription
>;
export const onUpdateNewsletter = /* GraphQL */ `subscription OnUpdateNewsletter(
  $filter: ModelSubscriptionNewsletterFilterInput
) {
  onUpdateNewsletter(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateNewsletterSubscriptionVariables,
  APITypes.OnUpdateNewsletterSubscription
>;
export const onUpdateNewsletterAccessLink = /* GraphQL */ `subscription OnUpdateNewsletterAccessLink(
  $filter: ModelSubscriptionNewsletterAccessLinkFilterInput
) {
  onUpdateNewsletterAccessLink(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateNewsletterAccessLinkSubscriptionVariables,
  APITypes.OnUpdateNewsletterAccessLinkSubscription
>;
export const onUpdateRecipient = /* GraphQL */ `subscription OnUpdateRecipient(
  $filter: ModelSubscriptionRecipientFilterInput
  $owner: String
) {
  onUpdateRecipient(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateRecipientSubscriptionVariables,
  APITypes.OnUpdateRecipientSubscription
>;
