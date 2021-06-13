import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as IneptInf from '../lib/inept_inf_pipeline';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new IneptInf.IneptInfPipeline(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
