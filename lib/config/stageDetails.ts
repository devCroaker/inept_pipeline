import { Bucket } from '@aws-cdk/aws-s3'

type stage = {
    stage: string,
    subdomain: string,
}

export const stages: stage[] = [
    {
        stage: 'Beta',
        subdomain: 'dev'
    },
    {
        stage: 'Prod',
        subdomain: ''
    }
]

export const beta = stages[0]
export const prod = stages[1]