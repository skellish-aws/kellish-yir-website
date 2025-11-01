// src/amplify-config.ts
import { Amplify } from 'aws-amplify'
import amplifyOutputs from '../amplify_outputs.json'

Amplify.configure(amplifyOutputs)
