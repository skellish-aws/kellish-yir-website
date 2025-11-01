/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createNewsletter = /* GraphQL */ `mutation CreateNewsletter(
  $condition: ModelNewsletterConditionInput
  $input: CreateNewsletterInput!
) {
  createNewsletter(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateNewsletterMutationVariables,
  APITypes.CreateNewsletterMutation
>;
export const createNewsletterAccessLink = /* GraphQL */ `mutation CreateNewsletterAccessLink(
  $condition: ModelNewsletterAccessLinkConditionInput
  $input: CreateNewsletterAccessLinkInput!
) {
  createNewsletterAccessLink(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateNewsletterAccessLinkMutationVariables,
  APITypes.CreateNewsletterAccessLinkMutation
>;
export const createRecipient = /* GraphQL */ `mutation CreateRecipient(
  $condition: ModelRecipientConditionInput
  $input: CreateRecipientInput!
) {
  createRecipient(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateRecipientMutationVariables,
  APITypes.CreateRecipientMutation
>;
export const deleteNewsletter = /* GraphQL */ `mutation DeleteNewsletter(
  $condition: ModelNewsletterConditionInput
  $input: DeleteNewsletterInput!
) {
  deleteNewsletter(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteNewsletterMutationVariables,
  APITypes.DeleteNewsletterMutation
>;
export const deleteNewsletterAccessLink = /* GraphQL */ `mutation DeleteNewsletterAccessLink(
  $condition: ModelNewsletterAccessLinkConditionInput
  $input: DeleteNewsletterAccessLinkInput!
) {
  deleteNewsletterAccessLink(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteNewsletterAccessLinkMutationVariables,
  APITypes.DeleteNewsletterAccessLinkMutation
>;
export const deleteRecipient = /* GraphQL */ `mutation DeleteRecipient(
  $condition: ModelRecipientConditionInput
  $input: DeleteRecipientInput!
) {
  deleteRecipient(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteRecipientMutationVariables,
  APITypes.DeleteRecipientMutation
>;
export const updateNewsletter = /* GraphQL */ `mutation UpdateNewsletter(
  $condition: ModelNewsletterConditionInput
  $input: UpdateNewsletterInput!
) {
  updateNewsletter(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateNewsletterMutationVariables,
  APITypes.UpdateNewsletterMutation
>;
export const updateNewsletterAccessLink = /* GraphQL */ `mutation UpdateNewsletterAccessLink(
  $condition: ModelNewsletterAccessLinkConditionInput
  $input: UpdateNewsletterAccessLinkInput!
) {
  updateNewsletterAccessLink(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateNewsletterAccessLinkMutationVariables,
  APITypes.UpdateNewsletterAccessLinkMutation
>;
export const updateRecipient = /* GraphQL */ `mutation UpdateRecipient(
  $condition: ModelRecipientConditionInput
  $input: UpdateRecipientInput!
) {
  updateRecipient(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateRecipientMutationVariables,
  APITypes.UpdateRecipientMutation
>;
