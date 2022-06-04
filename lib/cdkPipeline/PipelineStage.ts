import { Construct } from 'constructs'
import { Stage, StageProps } from 'aws-cdk-lib'
import { WebsiteStack, WebsiteStackProps } from './WebsiteStack'
import { stages, BETA, PROD } from '../config/stageDetails'
import { AuthStack } from '../auth/AuthStack'
import { PREFIX } from '../config/config'

export class PipelineStage extends Stage {
    constructor(scope: Construct, id: string, props: StageProps) {
        super(scope, id, props)

        const websiteInputs: WebsiteStackProps = {
            envVariables: {
                [BETA]: {},
                [PROD]: {},
            }
        }
        stages.forEach(stageDetails => {
            const { stage } = stageDetails

            const auth = new AuthStack(this, `AuthStack${stage}`, {stageDetails})

            //websiteInputs.envVariables[stage].authOutputs = auth.outputs
        })

        new WebsiteStack(this, `${PREFIX}IneptWebsite`, websiteInputs)
    }
}