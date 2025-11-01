/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type Newsletter = {
  __typename: "Newsletter",
  accessLinks?: ModelNewsletterAccessLinkConnection | null,
  cardImageUrl: string,
  createdAt: string,
  id: string,
  pdfUrl: string,
  updatedAt: string,
  year: number,
};

export type ModelNewsletterAccessLinkConnection = {
  __typename: "ModelNewsletterAccessLinkConnection",
  items:  Array<NewsletterAccessLink | null >,
  nextToken?: string | null,
};

export type NewsletterAccessLink = {
  __typename: "NewsletterAccessLink",
  createdAt: string,
  id: string,
  newsletter?: Newsletter | null,
  newsletterId: string,
  recipient?: Recipient | null,
  recipientId: string,
  uniqueUrlToken: string,
  updatedAt: string,
  used?: boolean | null,
};

export type Recipient = {
  __typename: "Recipient",
  accessLinks?: ModelNewsletterAccessLinkConnection | null,
  address1?: string | null,
  address2?: string | null,
  city?: string | null,
  createdAt: string,
  email: string,
  firstName: string,
  id: string,
  lastName: string,
  owner?: string | null,
  secondName?: string | null,
  state?: string | null,
  title?: string | null,
  updatedAt: string,
  wantsPaper: boolean,
  zipcode?: string | null,
};

export type ModelNewsletterAccessLinkFilterInput = {
  and?: Array< ModelNewsletterAccessLinkFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  newsletterId?: ModelIDInput | null,
  not?: ModelNewsletterAccessLinkFilterInput | null,
  or?: Array< ModelNewsletterAccessLinkFilterInput | null > | null,
  recipientId?: ModelIDInput | null,
  uniqueUrlToken?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  used?: ModelBooleanInput | null,
};

export type ModelStringInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  _null = "_null",
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
}


export type ModelSizeInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelIDInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export type ModelBooleanInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelNewsletterFilterInput = {
  and?: Array< ModelNewsletterFilterInput | null > | null,
  cardImageUrl?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelNewsletterFilterInput | null,
  or?: Array< ModelNewsletterFilterInput | null > | null,
  pdfUrl?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  year?: ModelIntInput | null,
};

export type ModelIntInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelNewsletterConnection = {
  __typename: "ModelNewsletterConnection",
  items:  Array<Newsletter | null >,
  nextToken?: string | null,
};

export type ModelRecipientFilterInput = {
  address1?: ModelStringInput | null,
  address2?: ModelStringInput | null,
  and?: Array< ModelRecipientFilterInput | null > | null,
  city?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  id?: ModelIDInput | null,
  lastName?: ModelStringInput | null,
  not?: ModelRecipientFilterInput | null,
  or?: Array< ModelRecipientFilterInput | null > | null,
  owner?: ModelStringInput | null,
  secondName?: ModelStringInput | null,
  state?: ModelStringInput | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  wantsPaper?: ModelBooleanInput | null,
  zipcode?: ModelStringInput | null,
};

export type ModelRecipientConnection = {
  __typename: "ModelRecipientConnection",
  items:  Array<Recipient | null >,
  nextToken?: string | null,
};

export type ModelNewsletterConditionInput = {
  and?: Array< ModelNewsletterConditionInput | null > | null,
  cardImageUrl?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  not?: ModelNewsletterConditionInput | null,
  or?: Array< ModelNewsletterConditionInput | null > | null,
  pdfUrl?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  year?: ModelIntInput | null,
};

export type CreateNewsletterInput = {
  cardImageUrl: string,
  id?: string | null,
  pdfUrl: string,
  year: number,
};

export type ModelNewsletterAccessLinkConditionInput = {
  and?: Array< ModelNewsletterAccessLinkConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  newsletterId?: ModelIDInput | null,
  not?: ModelNewsletterAccessLinkConditionInput | null,
  or?: Array< ModelNewsletterAccessLinkConditionInput | null > | null,
  recipientId?: ModelIDInput | null,
  uniqueUrlToken?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  used?: ModelBooleanInput | null,
};

export type CreateNewsletterAccessLinkInput = {
  id?: string | null,
  newsletterId: string,
  recipientId: string,
  uniqueUrlToken: string,
  used?: boolean | null,
};

export type ModelRecipientConditionInput = {
  address1?: ModelStringInput | null,
  address2?: ModelStringInput | null,
  and?: Array< ModelRecipientConditionInput | null > | null,
  city?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  not?: ModelRecipientConditionInput | null,
  or?: Array< ModelRecipientConditionInput | null > | null,
  owner?: ModelStringInput | null,
  secondName?: ModelStringInput | null,
  state?: ModelStringInput | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  wantsPaper?: ModelBooleanInput | null,
  zipcode?: ModelStringInput | null,
};

export type CreateRecipientInput = {
  address1?: string | null,
  address2?: string | null,
  city?: string | null,
  email: string,
  firstName: string,
  id?: string | null,
  lastName: string,
  secondName?: string | null,
  state?: string | null,
  title?: string | null,
  wantsPaper: boolean,
  zipcode?: string | null,
};

export type DeleteNewsletterInput = {
  id: string,
};

export type DeleteNewsletterAccessLinkInput = {
  id: string,
};

export type DeleteRecipientInput = {
  id: string,
};

export type UpdateNewsletterInput = {
  cardImageUrl?: string | null,
  id: string,
  pdfUrl?: string | null,
  year?: number | null,
};

export type UpdateNewsletterAccessLinkInput = {
  id: string,
  newsletterId?: string | null,
  recipientId?: string | null,
  uniqueUrlToken?: string | null,
  used?: boolean | null,
};

export type UpdateRecipientInput = {
  address1?: string | null,
  address2?: string | null,
  city?: string | null,
  email?: string | null,
  firstName?: string | null,
  id: string,
  lastName?: string | null,
  secondName?: string | null,
  state?: string | null,
  title?: string | null,
  wantsPaper?: boolean | null,
  zipcode?: string | null,
};

export type ModelSubscriptionNewsletterFilterInput = {
  and?: Array< ModelSubscriptionNewsletterFilterInput | null > | null,
  cardImageUrl?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionNewsletterFilterInput | null > | null,
  pdfUrl?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  year?: ModelSubscriptionIntInput | null,
};

export type ModelSubscriptionStringInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionIDInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionIntInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  in?: Array< number | null > | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionNewsletterAccessLinkFilterInput = {
  and?: Array< ModelSubscriptionNewsletterAccessLinkFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  newsletterId?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionNewsletterAccessLinkFilterInput | null > | null,
  recipientId?: ModelSubscriptionIDInput | null,
  uniqueUrlToken?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  used?: ModelSubscriptionBooleanInput | null,
};

export type ModelSubscriptionBooleanInput = {
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelSubscriptionRecipientFilterInput = {
  address1?: ModelSubscriptionStringInput | null,
  address2?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionRecipientFilterInput | null > | null,
  city?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  firstName?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  lastName?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionRecipientFilterInput | null > | null,
  owner?: ModelStringInput | null,
  secondName?: ModelSubscriptionStringInput | null,
  state?: ModelSubscriptionStringInput | null,
  title?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  wantsPaper?: ModelSubscriptionBooleanInput | null,
  zipcode?: ModelSubscriptionStringInput | null,
};

export type GetNewsletterQueryVariables = {
  id: string,
};

export type GetNewsletterQuery = {
  getNewsletter?:  {
    __typename: "Newsletter",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    cardImageUrl: string,
    createdAt: string,
    id: string,
    pdfUrl: string,
    updatedAt: string,
    year: number,
  } | null,
};

export type GetNewsletterAccessLinkQueryVariables = {
  id: string,
};

export type GetNewsletterAccessLinkQuery = {
  getNewsletterAccessLink?:  {
    __typename: "NewsletterAccessLink",
    createdAt: string,
    id: string,
    newsletter?:  {
      __typename: "Newsletter",
      cardImageUrl: string,
      createdAt: string,
      id: string,
      pdfUrl: string,
      updatedAt: string,
      year: number,
    } | null,
    newsletterId: string,
    recipient?:  {
      __typename: "Recipient",
      address1?: string | null,
      address2?: string | null,
      city?: string | null,
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      owner?: string | null,
      secondName?: string | null,
      state?: string | null,
      title?: string | null,
      updatedAt: string,
      wantsPaper: boolean,
      zipcode?: string | null,
    } | null,
    recipientId: string,
    uniqueUrlToken: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type GetRecipientQueryVariables = {
  id: string,
};

export type GetRecipientQuery = {
  getRecipient?:  {
    __typename: "Recipient",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    address1?: string | null,
    address2?: string | null,
    city?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    owner?: string | null,
    secondName?: string | null,
    state?: string | null,
    title?: string | null,
    updatedAt: string,
    wantsPaper: boolean,
    zipcode?: string | null,
  } | null,
};

export type ListNewsletterAccessLinksQueryVariables = {
  filter?: ModelNewsletterAccessLinkFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListNewsletterAccessLinksQuery = {
  listNewsletterAccessLinks?:  {
    __typename: "ModelNewsletterAccessLinkConnection",
    items:  Array< {
      __typename: "NewsletterAccessLink",
      createdAt: string,
      id: string,
      newsletterId: string,
      recipientId: string,
      uniqueUrlToken: string,
      updatedAt: string,
      used?: boolean | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListNewslettersQueryVariables = {
  filter?: ModelNewsletterFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListNewslettersQuery = {
  listNewsletters?:  {
    __typename: "ModelNewsletterConnection",
    items:  Array< {
      __typename: "Newsletter",
      cardImageUrl: string,
      createdAt: string,
      id: string,
      pdfUrl: string,
      updatedAt: string,
      year: number,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListRecipientsQueryVariables = {
  filter?: ModelRecipientFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListRecipientsQuery = {
  listRecipients?:  {
    __typename: "ModelRecipientConnection",
    items:  Array< {
      __typename: "Recipient",
      address1?: string | null,
      address2?: string | null,
      city?: string | null,
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      owner?: string | null,
      secondName?: string | null,
      state?: string | null,
      title?: string | null,
      updatedAt: string,
      wantsPaper: boolean,
      zipcode?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type CreateNewsletterMutationVariables = {
  condition?: ModelNewsletterConditionInput | null,
  input: CreateNewsletterInput,
};

export type CreateNewsletterMutation = {
  createNewsletter?:  {
    __typename: "Newsletter",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    cardImageUrl: string,
    createdAt: string,
    id: string,
    pdfUrl: string,
    updatedAt: string,
    year: number,
  } | null,
};

export type CreateNewsletterAccessLinkMutationVariables = {
  condition?: ModelNewsletterAccessLinkConditionInput | null,
  input: CreateNewsletterAccessLinkInput,
};

export type CreateNewsletterAccessLinkMutation = {
  createNewsletterAccessLink?:  {
    __typename: "NewsletterAccessLink",
    createdAt: string,
    id: string,
    newsletter?:  {
      __typename: "Newsletter",
      cardImageUrl: string,
      createdAt: string,
      id: string,
      pdfUrl: string,
      updatedAt: string,
      year: number,
    } | null,
    newsletterId: string,
    recipient?:  {
      __typename: "Recipient",
      address1?: string | null,
      address2?: string | null,
      city?: string | null,
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      owner?: string | null,
      secondName?: string | null,
      state?: string | null,
      title?: string | null,
      updatedAt: string,
      wantsPaper: boolean,
      zipcode?: string | null,
    } | null,
    recipientId: string,
    uniqueUrlToken: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type CreateRecipientMutationVariables = {
  condition?: ModelRecipientConditionInput | null,
  input: CreateRecipientInput,
};

export type CreateRecipientMutation = {
  createRecipient?:  {
    __typename: "Recipient",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    address1?: string | null,
    address2?: string | null,
    city?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    owner?: string | null,
    secondName?: string | null,
    state?: string | null,
    title?: string | null,
    updatedAt: string,
    wantsPaper: boolean,
    zipcode?: string | null,
  } | null,
};

export type DeleteNewsletterMutationVariables = {
  condition?: ModelNewsletterConditionInput | null,
  input: DeleteNewsletterInput,
};

export type DeleteNewsletterMutation = {
  deleteNewsletter?:  {
    __typename: "Newsletter",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    cardImageUrl: string,
    createdAt: string,
    id: string,
    pdfUrl: string,
    updatedAt: string,
    year: number,
  } | null,
};

export type DeleteNewsletterAccessLinkMutationVariables = {
  condition?: ModelNewsletterAccessLinkConditionInput | null,
  input: DeleteNewsletterAccessLinkInput,
};

export type DeleteNewsletterAccessLinkMutation = {
  deleteNewsletterAccessLink?:  {
    __typename: "NewsletterAccessLink",
    createdAt: string,
    id: string,
    newsletter?:  {
      __typename: "Newsletter",
      cardImageUrl: string,
      createdAt: string,
      id: string,
      pdfUrl: string,
      updatedAt: string,
      year: number,
    } | null,
    newsletterId: string,
    recipient?:  {
      __typename: "Recipient",
      address1?: string | null,
      address2?: string | null,
      city?: string | null,
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      owner?: string | null,
      secondName?: string | null,
      state?: string | null,
      title?: string | null,
      updatedAt: string,
      wantsPaper: boolean,
      zipcode?: string | null,
    } | null,
    recipientId: string,
    uniqueUrlToken: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type DeleteRecipientMutationVariables = {
  condition?: ModelRecipientConditionInput | null,
  input: DeleteRecipientInput,
};

export type DeleteRecipientMutation = {
  deleteRecipient?:  {
    __typename: "Recipient",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    address1?: string | null,
    address2?: string | null,
    city?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    owner?: string | null,
    secondName?: string | null,
    state?: string | null,
    title?: string | null,
    updatedAt: string,
    wantsPaper: boolean,
    zipcode?: string | null,
  } | null,
};

export type UpdateNewsletterMutationVariables = {
  condition?: ModelNewsletterConditionInput | null,
  input: UpdateNewsletterInput,
};

export type UpdateNewsletterMutation = {
  updateNewsletter?:  {
    __typename: "Newsletter",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    cardImageUrl: string,
    createdAt: string,
    id: string,
    pdfUrl: string,
    updatedAt: string,
    year: number,
  } | null,
};

export type UpdateNewsletterAccessLinkMutationVariables = {
  condition?: ModelNewsletterAccessLinkConditionInput | null,
  input: UpdateNewsletterAccessLinkInput,
};

export type UpdateNewsletterAccessLinkMutation = {
  updateNewsletterAccessLink?:  {
    __typename: "NewsletterAccessLink",
    createdAt: string,
    id: string,
    newsletter?:  {
      __typename: "Newsletter",
      cardImageUrl: string,
      createdAt: string,
      id: string,
      pdfUrl: string,
      updatedAt: string,
      year: number,
    } | null,
    newsletterId: string,
    recipient?:  {
      __typename: "Recipient",
      address1?: string | null,
      address2?: string | null,
      city?: string | null,
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      owner?: string | null,
      secondName?: string | null,
      state?: string | null,
      title?: string | null,
      updatedAt: string,
      wantsPaper: boolean,
      zipcode?: string | null,
    } | null,
    recipientId: string,
    uniqueUrlToken: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type UpdateRecipientMutationVariables = {
  condition?: ModelRecipientConditionInput | null,
  input: UpdateRecipientInput,
};

export type UpdateRecipientMutation = {
  updateRecipient?:  {
    __typename: "Recipient",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    address1?: string | null,
    address2?: string | null,
    city?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    owner?: string | null,
    secondName?: string | null,
    state?: string | null,
    title?: string | null,
    updatedAt: string,
    wantsPaper: boolean,
    zipcode?: string | null,
  } | null,
};

export type OnCreateNewsletterSubscriptionVariables = {
  filter?: ModelSubscriptionNewsletterFilterInput | null,
};

export type OnCreateNewsletterSubscription = {
  onCreateNewsletter?:  {
    __typename: "Newsletter",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    cardImageUrl: string,
    createdAt: string,
    id: string,
    pdfUrl: string,
    updatedAt: string,
    year: number,
  } | null,
};

export type OnCreateNewsletterAccessLinkSubscriptionVariables = {
  filter?: ModelSubscriptionNewsletterAccessLinkFilterInput | null,
};

export type OnCreateNewsletterAccessLinkSubscription = {
  onCreateNewsletterAccessLink?:  {
    __typename: "NewsletterAccessLink",
    createdAt: string,
    id: string,
    newsletter?:  {
      __typename: "Newsletter",
      cardImageUrl: string,
      createdAt: string,
      id: string,
      pdfUrl: string,
      updatedAt: string,
      year: number,
    } | null,
    newsletterId: string,
    recipient?:  {
      __typename: "Recipient",
      address1?: string | null,
      address2?: string | null,
      city?: string | null,
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      owner?: string | null,
      secondName?: string | null,
      state?: string | null,
      title?: string | null,
      updatedAt: string,
      wantsPaper: boolean,
      zipcode?: string | null,
    } | null,
    recipientId: string,
    uniqueUrlToken: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type OnCreateRecipientSubscriptionVariables = {
  filter?: ModelSubscriptionRecipientFilterInput | null,
  owner?: string | null,
};

export type OnCreateRecipientSubscription = {
  onCreateRecipient?:  {
    __typename: "Recipient",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    address1?: string | null,
    address2?: string | null,
    city?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    owner?: string | null,
    secondName?: string | null,
    state?: string | null,
    title?: string | null,
    updatedAt: string,
    wantsPaper: boolean,
    zipcode?: string | null,
  } | null,
};

export type OnDeleteNewsletterSubscriptionVariables = {
  filter?: ModelSubscriptionNewsletterFilterInput | null,
};

export type OnDeleteNewsletterSubscription = {
  onDeleteNewsletter?:  {
    __typename: "Newsletter",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    cardImageUrl: string,
    createdAt: string,
    id: string,
    pdfUrl: string,
    updatedAt: string,
    year: number,
  } | null,
};

export type OnDeleteNewsletterAccessLinkSubscriptionVariables = {
  filter?: ModelSubscriptionNewsletterAccessLinkFilterInput | null,
};

export type OnDeleteNewsletterAccessLinkSubscription = {
  onDeleteNewsletterAccessLink?:  {
    __typename: "NewsletterAccessLink",
    createdAt: string,
    id: string,
    newsletter?:  {
      __typename: "Newsletter",
      cardImageUrl: string,
      createdAt: string,
      id: string,
      pdfUrl: string,
      updatedAt: string,
      year: number,
    } | null,
    newsletterId: string,
    recipient?:  {
      __typename: "Recipient",
      address1?: string | null,
      address2?: string | null,
      city?: string | null,
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      owner?: string | null,
      secondName?: string | null,
      state?: string | null,
      title?: string | null,
      updatedAt: string,
      wantsPaper: boolean,
      zipcode?: string | null,
    } | null,
    recipientId: string,
    uniqueUrlToken: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type OnDeleteRecipientSubscriptionVariables = {
  filter?: ModelSubscriptionRecipientFilterInput | null,
  owner?: string | null,
};

export type OnDeleteRecipientSubscription = {
  onDeleteRecipient?:  {
    __typename: "Recipient",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    address1?: string | null,
    address2?: string | null,
    city?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    owner?: string | null,
    secondName?: string | null,
    state?: string | null,
    title?: string | null,
    updatedAt: string,
    wantsPaper: boolean,
    zipcode?: string | null,
  } | null,
};

export type OnUpdateNewsletterSubscriptionVariables = {
  filter?: ModelSubscriptionNewsletterFilterInput | null,
};

export type OnUpdateNewsletterSubscription = {
  onUpdateNewsletter?:  {
    __typename: "Newsletter",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    cardImageUrl: string,
    createdAt: string,
    id: string,
    pdfUrl: string,
    updatedAt: string,
    year: number,
  } | null,
};

export type OnUpdateNewsletterAccessLinkSubscriptionVariables = {
  filter?: ModelSubscriptionNewsletterAccessLinkFilterInput | null,
};

export type OnUpdateNewsletterAccessLinkSubscription = {
  onUpdateNewsletterAccessLink?:  {
    __typename: "NewsletterAccessLink",
    createdAt: string,
    id: string,
    newsletter?:  {
      __typename: "Newsletter",
      cardImageUrl: string,
      createdAt: string,
      id: string,
      pdfUrl: string,
      updatedAt: string,
      year: number,
    } | null,
    newsletterId: string,
    recipient?:  {
      __typename: "Recipient",
      address1?: string | null,
      address2?: string | null,
      city?: string | null,
      createdAt: string,
      email: string,
      firstName: string,
      id: string,
      lastName: string,
      owner?: string | null,
      secondName?: string | null,
      state?: string | null,
      title?: string | null,
      updatedAt: string,
      wantsPaper: boolean,
      zipcode?: string | null,
    } | null,
    recipientId: string,
    uniqueUrlToken: string,
    updatedAt: string,
    used?: boolean | null,
  } | null,
};

export type OnUpdateRecipientSubscriptionVariables = {
  filter?: ModelSubscriptionRecipientFilterInput | null,
  owner?: string | null,
};

export type OnUpdateRecipientSubscription = {
  onUpdateRecipient?:  {
    __typename: "Recipient",
    accessLinks?:  {
      __typename: "ModelNewsletterAccessLinkConnection",
      nextToken?: string | null,
    } | null,
    address1?: string | null,
    address2?: string | null,
    city?: string | null,
    createdAt: string,
    email: string,
    firstName: string,
    id: string,
    lastName: string,
    owner?: string | null,
    secondName?: string | null,
    state?: string | null,
    title?: string | null,
    updatedAt: string,
    wantsPaper: boolean,
    zipcode?: string | null,
  } | null,
};
