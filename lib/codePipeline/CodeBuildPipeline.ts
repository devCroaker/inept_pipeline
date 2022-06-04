import { Construct } from 'constructs'
import { SecretValue } from 'aws-cdk-lib'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { BuildSpec, PipelineProject, BuildEnvironmentVariableType } from 'aws-cdk-lib/aws-codebuild'
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline'
import { CodeBuildAction, GitHubSourceAction, GitHubTrigger, S3DeployAction } from 'aws-cdk-lib/aws-codepipeline-actions'
import { GITHUB_BRANCH, GITHUB_OWNER, GITHUB_TOKEN, WEBSITE_REPO, AWS_REGION, PREFIX } from '../config/config'
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { AuthOutputs } from '../auth/AuthStack'

export type EnvVariables = {
  websiteBucket: Bucket,
  authOutputs?: AuthOutputs
}

export class CodeBuildPipeline extends Construct {
  readonly addDeployStage: (stageName: string, envVariables: EnvVariables) => void

  constructor(scope: Construct, id: string) {
    super(scope, id)

    const pipeline = new Pipeline(this, `${PREFIX}WebCodePipeline`, {
      pipelineName: `${PREFIX}WebCodePipeline`,
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

    this.addDeployStage = (stageName: string, envVariables: EnvVariables) => {
      const { 
        websiteBucket,
        authOutputs,
      } = envVariables

      const outputWebsite = new Artifact()

      const role = new Role(this, `BuildSpecRole${stageName}`, {
        roleName: `BuildSpecRole${stageName}`,
        assumedBy: new ServicePrincipal('codebuild.amazonaws.com')
      })
      role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildAdminAccess'))
      role.addToPolicy(new PolicyStatement({
        actions: ['s3:*'],
        resources: [
          `${websiteBucket.bucketArn}`,
          `${websiteBucket.bucketArn}/*`
        ]
      }))

      pipeline.addStage({
        stageName: `Build${stageName}`,
        actions: [
          new CodeBuildAction({
            actionName: `BuildWebsite${stageName}`,
            project: new PipelineProject(this, `BuildWebsite${stageName}`, {
              projectName: `${PREFIX}Website${stageName}`,
              role,
              environmentVariables: {
                websiteBucket: {
                  value: websiteBucket.bucketName,
                  type: BuildEnvironmentVariableType.PLAINTEXT
                },
                region: {
                  value: AWS_REGION,
                  type: BuildEnvironmentVariableType.PLAINTEXT
                },
                userPoolId: {
                  value: authOutputs?.userPoolId || 'undefined',
                  type: BuildEnvironmentVariableType.PLAINTEXT
                },
                userPoolClientId: {
                  value: authOutputs?.userPoolClientId || 'undefined',
                  type: BuildEnvironmentVariableType.PLAINTEXT
                },
                identityPoolId: {
                  value: authOutputs?.identityPoolId || 'undefined',
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