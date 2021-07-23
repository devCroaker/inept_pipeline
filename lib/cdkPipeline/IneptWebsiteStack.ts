import { Construct, Stack, StackProps } from '@aws-cdk/core'
import { StageDetails } from '../config/PipelineStages'
import { IneptCodeBuildPipeline } from '../codePipeline/IneptCodeBuildPipeline'

export class IneptWebsiteStack extends Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id)

        const codePipeline = new IneptCodeBuildPipeline(this, `IneptCodeBuildPipeline`)
    }
}