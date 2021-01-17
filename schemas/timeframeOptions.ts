export const timeframeOptions: Array<{ id: string, values: { step: number, limit: number } }> = [
    { id: 'day', values: { step:1800, limit:48 } },
    { id: 'week', values: { step:14400, limit:42 } },
    { id: 'month', values: { step:43200, limit:60 } },
    { id: 'year', values: { step:259200, limit:122 }}
]