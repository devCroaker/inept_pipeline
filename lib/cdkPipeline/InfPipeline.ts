import { Construct } from 'constructs'
import { Stack, SecretValue, StackProps } from 'aws-cdk-lib/core'
import { CodeBuildStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines'
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions'

import {
  GITHUB_OWNER,
  GITHUB_BRANCH,
  GITHUB_TOKEN,
  PIPELINE_REPO,
  AWS_REGION,
  PREFIX,
  AWS_ACCOUNT
} from '../config/config'
import { PipelineStage } from './PipelineStage'

export class InfPipeline extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const pipeline = new CodePipeline(this, `${PREFIX}Pipeline`, {
      pipelineName: `${PREFIX}Pipeline`,
      selfMutation: true,
      synth: new CodeBuildStep('Synth', {
        input: CodePipelineSource.gitHub(`${GITHUB_OWNER}/${GITHUB_BRANCH}`, GITHUB_BRANCH, {
          authentication: SecretValue.secretsManager(GITHUB_TOKEN),
          trigger: GitHubTrigger.WEBHOOK,
        }),
        installCommands: [
          'npm i -g npm && npm install -g aws-cdk'
        ],
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth',
        ]
      })
    })

      /* Add application stages to the pipeline */
    const pipelineStage = new PipelineStage(this, `${PREFIX}Website`, {
      env: { account: AWS_ACCOUNT, region: AWS_REGION }
    })
    pipeline.addStage(pipelineStage)
  }
}
