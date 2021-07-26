import { Construct, SecretValue } from '@aws-cdk/core'
import { Bucket } from '@aws-cdk/aws-s3'
import { BuildSpec, PipelineProject } from '@aws-cdk/aws-codebuild'
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline'
import { CodeBuildAction, GitHubSourceAction, GitHubTrigger, S3DeployAction } from '@aws-cdk/aws-codepipeline-actions'
import { GITHUB_BRANCH, GITHUB_OWNER, GITHUB_TOKEN, WEBSITE_REPO } from '../config/config'

export class IneptCodeBuildPipeline extends Construct {
  readonly addDeployStage: (stageName: string, websiteBucket: Bucket) => void

  constructor(scope: Construct, id: string) {
    super(scope, id)

    const pipeline = new Pipeline(this, `IneptWebCodePipeline`, {
      pipelineName: `IneptWebCodePipeline`,
      restartExecutionOnUpdate: true
    })

    const outputSources = new Artifact()
    const outputWebsite = new Artifact()

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          actionName: 'Checkout',
          owner: GITHUB_OWNER,
          repo: WEBSITE_REPO,
          branch: GITHUB_BRANCH,
          oauthToken: SecretValue.secretsManager(GITHUB_TOKEN),
          output: outputSources,
          trigger: GitHubTrigger.WEBHOOK
        })
      ]
    })

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          actionName: 'Website',
          project: new PipelineProject(this, 'BuildWebsite', {
            projectName: `IneptWebsite`,
            buildSpec: BuildSpec.fromSourceFilename('./buildspec.yml')
          }),
          input: outputSources,
          outputs: [outputWebsite]
        })
      ]
    })

    this.addDeployStage = (stageName: string, websiteBucket: Bucket) => {
      pipeline.addStage({
        stageName: `Deploy${stageName}`,
        actions: [
            new S3DeployAction({
                actionName: `Website${stageName}`,
                input: outputWebsite,
                bucket: websiteBucket
            })
        ]
      })
    }
  }
}