export interface StageDetails {
    stage: string,
    region: string
}

export const pipelineStages: StageDetails[] = [
    {
        stage: 'beta',
        region: 'us-west-1'
    },
    {
        stage: 'prod',
        region: 'us-west-2'
    }
]