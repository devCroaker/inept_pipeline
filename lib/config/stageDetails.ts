export const BETA = 'Beta'
export const PROD = 'Prod'

export type StageName = typeof BETA | typeof PROD

export type stage = {
    stage: StageName,
    subdomain: string,
}

export const stages: stage[] = [
    {
        stage: BETA,
        subdomain: 'dev'
    },
    {
        stage: PROD,
        subdomain: ''
    }
]