import * as cdk from '@aws-cdk/core'
import * as pipelines from '@aws-cdk/pipelines'
import * as codepipeline from '@aws-cdk/aws-codepipeline'
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions'

export class IneptInfPipeline extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const sourceArtifact = new codepipeline.Artifact()
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const pipeline = new pipelines.CdkPipeline(this, 'IneptPipeline', {
      pipelineName: 'IneptPipeline',
      cloudAssemblyArtifact,
      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'Source',
        owner: 'devCroaker',
        repo: 'inept_pipeline',
        branch: 'main',
        oauthToken: cdk.SecretValue.secretsManager('github-oauth-token'),
        output: sourceArtifact
      }),
      synthAction: pipelines.SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        installCommand: 'npm i -g npm@latest && npm ci',
        environment: {
          privileged: true
        }
      })
    })

  }
}
