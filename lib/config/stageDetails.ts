export type stage = {
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