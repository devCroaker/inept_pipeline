import { Stack, Construct, SecretValue, StackProps } from '@aws-cdk/core'
import { CdkPipeline, SimpleSynthAction } from '@aws-cdk/pipelines'
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline'
import { CodeBuildAction, GitHubSourceAction, GitHubTrigger, S3DeployAction } from '@aws-cdk/aws-codepipeline-actions'
import { BuildSpec, PipelineProject } from '@aws-cdk/aws-codebuild'

import {
  GITHUB_OWNER,
  GITHUB_BRANCH,
  GITHUB_TOKEN,
  PIPELINE_REPO,
  WEBSITE_REPO
} from './config/config'
import { pipelineStages } from './config/pipeline_stages'
import { IneptPipelineStage } from './inept_pipeline_stage'

export class IneptInfPipeline extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    /* Setup the basic self updating pipeline */
    const infSourceArtifact = new Artifact()
    const webSourceArtifact = new Artifact()
    const webBuildArtifact = new Artifact()
    const cloudAssemblyArtifact = new Artifact()

    const pipeline = new Pipeline(this, 'IneptCodePipeline', {
      pipelineName: 'IneptCodePipeline',
      restartExecutionOnUpdate: true
    })

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          actionName: 'IneptInfSource',
          owner: GITHUB_OWNER,
          repo: PIPELINE_REPO,
          branch: GITHUB_BRANCH,
          oauthToken: SecretValue.secretsManager(GITHUB_TOKEN),
          output: infSourceArtifact,
          trigger: GitHubTrigger.WEBHOOK
        }),
        new GitHubSourceAction({
          actionName: 'IneptWebsiteSource',
          owner: GITHUB_OWNER,
          repo: WEBSITE_REPO,
          branch: GITHUB_BRANCH,
          oauthToken: SecretValue.secretsManager(GITHUB_TOKEN),
          output: webSourceArtifact,
          trigger: GitHubTrigger.WEBHOOK
        })
      ]
    })

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          actionName: 'IneptWeb',
          project: new PipelineProject(this, 'BuildWebPackage', {
            projectName: 'IneptWeb',
            buildSpec: BuildSpec.fromSourceFilename('./config/buildspec.yml')
          }),
          input: webSourceArtifact,
          outputs: [webBuildArtifact]
        })
      ]
    })

    const cdkPipeline = new CdkPipeline(this, 'IneptCdkPipeline', {
      pipelineName: 'IneptCdkPipeline',
      cloudAssemblyArtifact,
      codePipeline: pipeline,
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact: infSourceArtifact,
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
      const pipelineStage = new IneptPipelineStage(this, `IneptWebsiteStage-${stage}`, {
        stageDetails,
        env: { account: '388722820338', region }
      })
      cdkPipeline.addApplicationStage(pipelineStage)
      pipeline.addStage({
        stageName: `Deploy-${stage}`,
        actions: [
          new S3DeployAction({
            actionName: `DeployWebsite-${stage}`,
            input: webBuildArtifact,
            bucket: pipelineStage.webBucket
          })
        ]
      })
    })

  }
}
