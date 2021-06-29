import { IneptWebsiteStack } from './inept_website_stack'
import { Stage, Construct, StageProps } from '@aws-cdk/core'
import { Bucket } from '@aws-cdk/aws-s3'

import { StageDetails } from './config/pipeline_stages'

export interface IneptPipelineStageProps extends StageProps {
    stageDetails: StageDetails
}

export class IneptPipelineStage extends Stage {
    readonly webBucket: Bucket
    constructor(scope: Construct, id: string, props: IneptPipelineStageProps) {
        super(scope, id, props)
        const { stageDetails: { stage } } = props

        const stack = new IneptWebsiteStack(this, `IneptStack-${stage}`, props)

        this.webBucket = stack.webBucket
    }
}