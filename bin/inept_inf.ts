#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import { IneptInfPipeline } from '../lib/inept_inf_pipeline';

const app = new App();
new IneptInfPipeline(app, 'IneptInfStack', {
   env: { account: '388722820338', region: 'us-west-2' }
});
