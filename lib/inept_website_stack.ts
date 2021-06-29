import { Construct, Stack, StackProps } from '@aws-cdk/core'
import { Bucket } from '@aws-cdk/aws-s3'

import { StageDetails } from './config/pipeline_stages'

export interface IneptPipelineStackProps extends StackProps {
    stageDetails: StageDetails
}

export class IneptWebsiteStack extends Stack {
    readonly webBucket: Bucket
    constructor(scope: Construct, id: string, props: IneptPipelineStackProps) {
        super(scope, id, props)
        const { stageDetails: { stage } } = props

        // Amazon S3 bucket to store CRA website
        const websiteBucket = new Bucket(this, `IneptWebsiteFiles-${stage}`, {
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error.html',
            publicReadAccess: true,
        })

        this.webBucket = websiteBucket
    }
}