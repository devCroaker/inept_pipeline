import { IneptWebsiteStack } from './IneptWebsiteStack'
import { Stage, Construct, StageProps } from '@aws-cdk/core'
import { stages } from '../config/stageDetails'
import { AuthStack } from '../auth/AuthStack'

export class IneptPipelineStage extends Stage {
    constructor(scope: Construct, id: string, props: StageProps) {
        super(scope, id, props)

        stages.forEach(stageDetails => {
            const { stage } = stageDetails

            const auth = new AuthStack(this, `AuthStack${stage}`, {stageDetails})

        })

        new IneptWebsiteStack(this, 'IneptWebsite')
    }
}