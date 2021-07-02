import { Construct, SecretValue } from '@aws-cdk/core'
import { BuildSpec, PipelineProject } from '@aws-cdk/aws-codebuild'
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline'
import { CodeBuildAction, GitHubSourceAction, GitHubTrigger, S3DeployAction } from '@aws-cdk/aws-codepipeline-actions'
import { Bucket } from '@aws-cdk/aws-s3'
import { GITHUB_OWNER, GITHUB_TOKEN, WEBSITE_REPO } from '../config/config'
import { StageDetails } from '../config/PipelineStages'

export interface CodeBuildPipelineProps {
    stageDetails: StageDetails
}

export class IneptCodeBuildPipeline extends Construct {
    constructor(scope: Construct, id: string, props: CodeBuildPipelineProps) {
        super(scope, id)
        const { stageDetails: { stage } } = props

        const websiteBucket = new Bucket(this, `IneptWebsiteFiles-${stage}`, {
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error.html',
            publicReadAccess: true,
        })

        const pipeline = new Pipeline(this, `IneptWebCodePipeline-${stage}`, {
            pipelineName: `IneptWebCodePipeline-${stage}`,
            restartExecutionOnUpdate: true
          })
      
          const outputSources = new Artifact()
          const outputWebsite = new Artifact()
      
          pipeline.addStage({
            stageName: `Source-${stage}`,
            actions: [
              new GitHubSourceAction({
                actionName: `Checkout-${stage}`,
                owner: GITHUB_OWNER,
                repo: WEBSITE_REPO,
                oauthToken: SecretValue.secretsManager(GITHUB_TOKEN),
                output: outputSources,
                trigger: GitHubTrigger.WEBHOOK
              })
            ]
          })
      
          pipeline.addStage({
            stageName: `Build-${stage}`,
            actions: [
              new CodeBuildAction({
                actionName: `Website-${stage}`,
                project: new PipelineProject(this, `BuildWebsite-${stage}`, {
                  projectName: `Website-${stage}`,
                  buildSpec: BuildSpec.fromSourceFilename('')
                }),
                input: outputSources,
                outputs: [outputWebsite]
              })
            ]
          })

          pipeline.addStage({
            stageName: `Deploy-${stage}`,
            actions: [
                new S3DeployAction({
                    actionName: `Website-${stage}`,
                    input: outputWebsite,
                    bucket: websiteBucket
                })
            ]
          })

    }
}