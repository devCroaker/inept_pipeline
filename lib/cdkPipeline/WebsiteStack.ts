import { Construct } from 'constructs'
import { Stack, RemovalPolicy, StackProps } from 'aws-cdk-lib'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { HttpsRedirect } from 'aws-cdk-lib/aws-route53-patterns'
import { DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { 
    CloudFrontWebDistribution,
    OriginAccessIdentity, 
    SecurityPolicyProtocol, 
    SSLMethod, 
    ViewerCertificate 
} from 'aws-cdk-lib/aws-cloudfront'
import { CodeBuildPipeline } from '../codePipeline/CodeBuildPipeline'
import { AWS_SSL_REGION, PREFIX, WEBSITE_DOMAIN } from '../config/config'
import { stages, BETA, PROD } from '../config/stageDetails'
import { AuthOutputs } from '../auth/AuthStack'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'

export interface WebsiteStackProps extends StackProps {
    envVariables: {
        [BETA]: {
            authOutputs?: AuthOutputs
        },
        [PROD]: {
            authOutputs?: AuthOutputs
        }
    }
}

export class WebsiteStack extends Stack {
    constructor(scope: Construct, id: string, props: WebsiteStackProps) {
        super(scope, id)

        const { envVariables } = props

        const codePipeline = new CodeBuildPipeline(this, `${PREFIX}CodeBuildPipeline`)

        const zone = HostedZone.fromLookup(this, `${PREFIX}Zone`, {
            domainName: WEBSITE_DOMAIN
        })

        const cloudFrontOAI = new OriginAccessIdentity(this, `${PREFIX}OAI`, {
            comment: 'OAI for the website'
        })

        new HttpsRedirect(this, 'wwwToNonWww', {
            recordNames: [`www.${WEBSITE_DOMAIN}`],
            targetDomain: WEBSITE_DOMAIN,
            zone
        })
        
        stages.forEach(stage => {
            const { stage: stageName, subdomain } = stage

            const domainName = (stageName === 'Beta') ? subdomain + '.' + WEBSITE_DOMAIN : WEBSITE_DOMAIN
            const certificate = new DnsValidatedCertificate(this, `${PREFIX}Certificate${stageName}`, {
                domainName,
                hostedZone: zone,
                region: AWS_SSL_REGION
            })

            const websiteBucket = new Bucket(this, `${PREFIX}WebsiteFiles${stageName}`, {
                bucketName: `${PREFIX.toLowerCase()}-website-files-${stageName.toLowerCase()}`,
                websiteIndexDocument: "index.html",
                websiteErrorDocument: "index.html",
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

            const distribution = new CloudFrontWebDistribution(this, `${PREFIX}Distribution${stageName}`, {
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

            new ARecord(this, `${PREFIX}AliasRecord${stageName}`, {
                recordName: domainName,
                target: RecordTarget.fromAlias(
                    new CloudFrontTarget(distribution)
                ),
                zone
            })

            codePipeline.addDeployStage(stageName, {
                websiteBucket,
                authOutputs: envVariables[stageName].authOutputs
            })

        })
    }
}