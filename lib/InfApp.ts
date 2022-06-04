#!/usr/bin/env node
import 'source-map-support/register'
import { App } from 'aws-cdk-lib'
import { InfPipeline } from './cdkPipeline/InfPipeline'
import { AWS_REGION, PREFIX } from './config/config'

const app = new App()
new InfPipeline(app, `${PREFIX}InfStack`, {
   env: { account: '388722820338', region: AWS_REGION }
})
