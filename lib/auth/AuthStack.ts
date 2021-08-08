import { Stack, Construct, StackProps } from '@aws-cdk/core'
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment, UserPool, UserPoolClient } from '@aws-cdk/aws-cognito'
import { Effect, FederatedPrincipal, PolicyStatement, Role } from '@aws-cdk/aws-iam'
import { stage } from '../config/stageDetails'

export interface AuthStackProps extends StackProps {
    stageDetails: stage
}

export type AuthOutputs = {
    userPoolId: UserPool["userPoolId"],
    userPoolClientId: UserPoolClient["userPoolClientId"],
    identityPoolId: CfnIdentityPool["ref"]
}

export class AuthStack extends Stack {
    public readonly role: Role
    public readonly outputs: AuthOutputs

    constructor(scope: Construct, id: string, props: AuthStackProps) {
        super(scope, id)

        const { stageDetails: { stage } } = props

        const userPool = new UserPool(this, 'UserPool', {
            userPoolName: `UserPool${stage}`,
            selfSignUpEnabled: true,
            autoVerify: { email: true },
            signInAliases: { email: true }
        })

        const userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
            userPoolClientName: `UserPoolClient${stage}`,
            userPool,
            generateSecret: false
        })

        const identityPool = new CfnIdentityPool(this, 'IdentityPool', {
            identityPoolName: `IdentityPool${stage}`,
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [
                {
                    clientId: userPoolClient.userPoolClientId,
                    providerName: userPool.userPoolProviderName
                }
            ]
        })

        this.role = new Role(this, 'DefaultAuthRole', {
            roleName: `DefaultAuthRole${stage}`,
            assumedBy: new FederatedPrincipal(
                'cognito-identity.amazonaws.com',
                {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud': identityPool.ref
                    },
                    'ForAnyValue:StringLike': {
                        'cofnito-identity.amazonaws.com:amr': 'authenticated'
                    }
                },
                'sts:AssumeRoleWithWebIdentity'
            )
        })
        this.role.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'mobileanalytics:PutEvents',
                'cognito-sync:*',
                'cognito-identity:*'
            ],
            resources: ['*']
        }))

        new CfnIdentityPoolRoleAttachment(this, "IdentityPoolRoleAttachment", {
            identityPoolId: identityPool.ref,
            roles: { authenticated: this.role.roleArn }
        })

        this.outputs = {
            userPoolId: userPool.userPoolId,
            userPoolClientId: userPoolClient.userPoolClientId,
            identityPoolId: identityPool.ref
        }
    }
}