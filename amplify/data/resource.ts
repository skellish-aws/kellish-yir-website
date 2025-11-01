import { type ClientSchema, a, defineData } from '@aws-amplify/backend'

const schema = a.schema({
  Recipient: a
    .model({
      title: a.string(),
      firstName: a.string().required(),
      secondName: a.string(),
      lastName: a.string().required(),
      suffix: a.string(),
      mailingName: a.string(), // Override for envelope/label (e.g., "Mr. and Mrs. John Smith")
      address1: a.string(),
      address2: a.string(),
      city: a.string(),
      state: a.string(),
      zipcode: a.string(),
      country: a.string(),
      email: a.string(),
      wantsPaper: a.boolean().default(true),
      sendCard: a.boolean().default(true), // Whether to send them a card
      accessCode: a.string(), // Their unique access code
      accessCodeUsed: a.boolean().default(false),
      accessCodeUsedAt: a.datetime(),
      // Address validation fields
      addressValidationStatus: a.string().default('pending'), // 'pending', 'queued', 'valid', 'invalid', 'error', 'overridden'
      addressValidationMessage: a.string(), // Error message or validation details
      addressValidatedAt: a.datetime(), // When validation was last performed
      validatedAddress1: a.string(), // USPS/Geoapify validated address
      validatedAddress2: a.string(),
      validatedCity: a.string(),
      validatedState: a.string(),
      validatedZipcode: a.string(),
      validatedCountry: a.string(),
      accessLinks: a.hasMany('NewsletterAccessLink', 'recipientId'),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [allow.group('Admin')]),

  Newsletter: a
    .model({
      title: a.string().required(),
      year: a.integer().required(),
      hasCardImage: a.boolean(),
      cardWidthIn: a.float(),
      cardHeightIn: a.float(),
      pdfWidthIn: a.float(),
      pdfHeightIn: a.float(),
      accessLinks: a.hasMany('NewsletterAccessLink', 'newsletterId'),
      pdfPageCount: a.integer(),
    })
    .authorization((allow) => [allow.group('Admin')]),

  // Access codes - one per recipient, gives access to all newsletters
  AccessCode: a
    .model({
      code: a.string().required(), // e.g., "KEL-XXXX-XXXX"
      recipientName: a.string().required(),
      recipientAddress: a.string(),
      used: a.boolean().default(false),
      usedAt: a.datetime(),
      createdAt: a.datetime().required(),
      // Link to the user who used this code
      usedBy: a.id(), // NewsletterUser ID
    })
    .authorization((allow) => [allow.group('Admin')]),

  // Newsletter access links
  NewsletterAccessLink: a
    .model({
      uniqueUrlToken: a.string().required(),
      used: a.boolean().default(false),
      newsletterId: a.id().required(),
      recipientId: a.id().required(),
      newsletter: a.belongsTo('Newsletter', 'newsletterId'),
      recipient: a.belongsTo('Recipient', 'recipientId'),
    })
    .authorization((allow) => [allow.group('Admin')]),

  // Public user model for newsletter access
  NewsletterUser: a
    .model({
      email: a.string().required(),
      accessCode: a.string().required(),
      registeredAt: a.datetime().required(),
      lastLoginAt: a.datetime(),
      accessLevel: a.string().default('viewer'), // 'viewer', 'admin'
    })
    .authorization((allow) => [allow.group('Admin'), allow.owner()]),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
})
