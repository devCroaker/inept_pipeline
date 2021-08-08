import { Construct, SecretValue } from '@aws-cdk/core'
import { Bucket } from '@aws-cdk/aws-s3'
import { BuildSpec, PipelineProject, BuildEnvironmentVariableType } from '@aws-cdk/aws-codebuild'
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline'
import { CodeBuildAction, GitHubSourceAction, GitHubTrigger, S3DeployAction } from '@aws-cdk/aws-codepipeline-actions'
import { GITHUB_BRANCH, GITHUB_OWNER, GITHUB_TOKEN, WEBSITE_REPO } from '../config/config'
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement } from '@aws-cdk/aws-iam'

export class IneptCodeBuildPipeline extends Construct {
  readonly addDeployStage: (stageName: string, websiteBucket: Bucket) => void

  constructor(scope: Construct, id: string) {
    super(scope, id)

    const pipeline = new Pipeline(this, `IneptWebCodePipeline`, {
      pipelineName: `IneptWebCodePipeline`,
      restartExecutionOnUpdate: true
    })

    const outputSources = new Artifact()

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

    this.addDeployStage = (stageName: string, websiteBucket: Bucket) => {

      const outputWebsite = new Artifact()

      const role = new Role(this, `BuildSpecRole${stageName}`, {
        roleName: `BuildSpecRole${stageName}`,
        assumedBy: new ServicePrincipal('codebuild.amazonaws.com')
      })
      role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildAdminAccess'))
      role.addToPolicy(new PolicyStatement({
        actions: ['s3:*'],
        resources: [`${websiteBucket.bucketArn}/*`]
      }))

      pipeline.addStage({
        stageName: `Build${stageName}`,
        actions: [
          new CodeBuildAction({
            actionName: `BuildWebsite${stageName}`,
            project: new PipelineProject(this, `BuildWebsite${stageName}`, {
              projectName: `IneptWebsite${stageName}`,
              role,
              environmentVariables: {
                websiteBucket: {
                  value: websiteBucket.bucketName,
                  type: BuildEnvironmentVariableType.PLAINTEXT
                }
              },
              buildSpec: BuildSpec.fromSourceFilename('./buildspec.yml')
            }),
            input: outputSources,
            outputs: [outputWebsite]
          })
        ]
      })

      pipeline.addStage({
        stageName: `Deploy${stageName}`,
        actions: [
            new S3DeployAction({
                actionName: `DeployWebsite${stageName}`,
                input: outputWebsite,
                bucket: websiteBucket
            })
        ]
      })
    }
  }
}