import { CfnOutput, Construct, Stack, StackProps } from '@aws-cdk/core'
import { Bucket } from '@aws-cdk/aws-s3'

import { StageDetails } from './config/pipeline_stages'

interface IneptStackProps extends StackProps {
    stageDetails: StageDetails
}

export class IneptWebsiteStack extends Stack {
    constructor(scope: Construct, id: string, props: IneptStackProps) {
        super(scope, id, props)
        const { stageDetails: { stage } } = props

        const websiteBucket = new Bucket(this, `IneptWebsiteFiles-${stage}`, {
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error.html',
            publicReadAccess: true,
        })

        new CfnOutput(this, `IneptWebsiteBucket-${stage}`, {
            exportName: `IneptWebsiteBucketArn-${stage}`,
            value: websiteBucket.bucketArn
        })
    }
}