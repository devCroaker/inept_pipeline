import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Inf from '../lib/inf_pipeline';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Inf.InfPipeline(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
