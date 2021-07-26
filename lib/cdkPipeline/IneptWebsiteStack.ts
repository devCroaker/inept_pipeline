import { Construct, Stack, RemovalPolicy } from '@aws-cdk/core'
import { Bucket } from '@aws-cdk/aws-s3'
import { PolicyStatement } from '@aws-cdk/aws-iam'
import { ARecord, HostedZone, RecordTarget } from '@aws-cdk/aws-route53'
import { DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager'
import { 
    CloudFrontWebDistribution, 
    OriginProtocolPolicy, 
    OriginAccessIdentity, 
    SecurityPolicyProtocol, 
    SSLMethod, 
    ViewerCertificate 
} from '@aws-cdk/aws-cloudfront'
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets/lib'
import { IneptCodeBuildPipeline } from '../codePipeline/IneptCodeBuildPipeline'
import { AWS_REGION, WEBSITE_DOMAIN } from '../config/config'
import { stages } from '../config/stageDetails'

export class IneptWebsiteStack extends Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id)

        const codePipeline = new IneptCodeBuildPipeline(this, `IneptCodeBuildPipeline`)

        const zone = HostedZone.fromLookup(this, 'IneptZone', {
            domainName: WEBSITE_DOMAIN
        })

        const cloudFrontOAI = new OriginAccessIdentity(this, 'IneptOAI', {
            comment: 'OAI for inept website'
        })
        
        stages.forEach(stage => {
            const { stage: stageName, subdomain } = stage

            const domainName = subdomain + '.' + WEBSITE_DOMAIN
            const certificate = new DnsValidatedCertificate(this, `IneptCertificate${stageName}`, {
                domainName,
                hostedZone: zone,
                region: AWS_REGION
            })

            const websiteBucket = new Bucket(this, `IneptWebsiteFiles${stageName}`, {
                bucketName: `inept-website-files-${stageName.toLowerCase()}`,
                removalPolicy: RemovalPolicy.DESTROY
            })

            const cloudFrontS3AccessPolicy = new PolicyStatement({
                resources: [`${websiteBucket.bucketArn}`, `${websiteBucket.bucketArn}/*`],
                actions: ['s3:GetBucket*', 's3:GetObject*', 's3:List*']
            })
            cloudFrontS3AccessPolicy.addCanonicalUserPrincipal(
                cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
            )
            websiteBucket.addToResourcePolicy(cloudFrontS3AccessPolicy)

            const distribution = new CloudFrontWebDistribution(this, `IneptDistribution${stageName}`, {
                viewerCertificate: ViewerCertificate.fromAcmCertificate(certificate, {
                    aliases: [domainName],
                    securityPolicy: SecurityPolicyProtocol.TLS_V1_1_2016,
                    sslMethod: SSLMethod.SNI
                }),
                originConfigs: [{
                    s3OriginSource: {
                        s3BucketSource: websiteBucket,
                        originAccessIdentity: cloudFrontOAI
                    },
                    behaviors: [{ isDefaultBehavior: true }]
                }]
            })

            const aRecord = new ARecord(this, `IneptAliasRecord${stageName}`, {
                recordName: domainName,
                target: RecordTarget.fromAlias(
                    new CloudFrontTarget(distribution)
                ),
                zone
            })

            codePipeline.addDeployStage(stageName, websiteBucket)

        })
    }
}