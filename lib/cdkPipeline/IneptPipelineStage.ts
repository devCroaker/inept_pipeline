import { IneptWebsiteStack } from './IneptWebsiteStack'
import { Stage, Construct, StageProps } from '@aws-cdk/core'

export class IneptPipelineStage extends Stage {
    constructor(scope: Construct, id: string, props: StageProps) {
        super(scope, id, props)

        new IneptWebsiteStack(this, 'IneptWebsite')
    }
}