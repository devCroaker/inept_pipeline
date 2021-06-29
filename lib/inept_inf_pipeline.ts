import { Stack, Construct, SecretValue, StackProps } from '@aws-cdk/core'
import { CdkPipeline, SimpleSynthAction } from '@aws-cdk/pipelines'
import { Artifact } from '@aws-cdk/aws-codepipeline'
import { GitHubSourceAction, GitHubTrigger } from '@aws-cdk/aws-codepipeline-actions'

import {
  GITHUB_OWNER,
  GITHUB_BRANCH,
  GITHUB_TOKEN,
  PIPELINE_REPO
} from './config'
import { pipelineStages } from './config/pipeline_stages'
import { IneptPipelineStage } from './inept_pipeline_stage'

export class IneptInfPipeline extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    /* Setup the basic self updating pipeline */
    const sourceArtifact = new Artifact()
    const cloudAssemblyArtifact = new Artifact();
    const pipeline = new CdkPipeline(this, 'IneptPipeline', {
      pipelineName: 'IneptPipeline',
      cloudAssemblyArtifact,
      sourceAction: new GitHubSourceAction({
        actionName: 'Source',
        owner: GITHUB_OWNER,
        repo: PIPELINE_REPO,
        branch: GITHUB_BRANCH,
        oauthToken: SecretValue.secretsManager(GITHUB_TOKEN),
        output: sourceArtifact,
        trigger: GitHubTrigger.WEBHOOK
      }),
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        installCommand: 'npm i -g npm && npm ci',
        environment: {
          privileged: true
        }
      })
    })

    pipelineStages.map(stageDetails => {
      const { stage, region } = stageDetails

      /* Add application stages to the pipeline */
      const pipelineStage = new IneptPipelineStage(this, `IneptWebsite-${stage}`, {
        stageDetails,
        env: { account: '388722820338', region }
      })
      pipeline.addApplicationStage(pipelineStage)
    })
  }
}
