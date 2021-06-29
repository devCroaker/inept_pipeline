import { IneptWebsiteStack } from './inept_website_stack'
import { Stage, Construct, StageProps } from '@aws-cdk/core'

import { StageDetails } from './config/pipeline_stages'

interface IneptStageProps extends StageProps {
    stageDetails: StageDetails
}

export class IneptPipelineStage extends Stage {
    constructor(scope: Construct, id: string, props: IneptStageProps) {
        super(scope, id, props)

        new IneptWebsiteStack(this, 'IneptWebsite', props)
    }
}