import { Construct, Stack, StackProps } from '@aws-cdk/core'
import { StageDetails } from '../config/PipelineStages'
import { IneptCodeBuildPipeline } from '../codePipeline/IneptCodeBuildPipeline'

interface IneptStackProps extends StackProps {
    stageDetails: StageDetails
}

export class IneptWebsiteStack extends Stack {
    constructor(scope: Construct, id: string, props: IneptStackProps) {
        super(scope, id, props)
        const { stageDetails } = props
        const { stage } = stageDetails

        const codePipeline = new IneptCodeBuildPipeline(this, `IneptCodeBuildPipeline-${stage}`, {
            stageDetails
        })
    }
}