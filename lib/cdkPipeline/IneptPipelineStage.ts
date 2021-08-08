import { IneptWebsiteStack, WebsiteStackProps } from './IneptWebsiteStack'
import { Stage, Construct, StageProps } from '@aws-cdk/core'
import { stages, BETA, PROD } from '../config/stageDetails'
import { AuthStack } from '../auth/AuthStack'

export class IneptPipelineStage extends Stage {
    constructor(scope: Construct, id: string, props: StageProps) {
        super(scope, id, props)

        const websiteInputs: WebsiteStackProps = {
            envVariables: {
                [BETA]: {},
                [PROD]: {}
            }
        }
        stages.forEach(stageDetails => {
            const { stage } = stageDetails

            const auth = new AuthStack(this, `AuthStack${stage}`, {stageDetails})

            websiteInputs.envVariables[stage].authOutputs = auth.outputs
        })

        new IneptWebsiteStack(this, 'IneptWebsite', websiteInputs)
    }
}