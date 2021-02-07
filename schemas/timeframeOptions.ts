export const timeframeOptions = new Map([
    ['day',     { step:1800, limit:48 }],
    ['week',    { step:14400, limit:42 }],
    ['month',   { step:43200, limit:60 }],
    ['year',    { step:259200, limit:122 }]
])

export const candlestickOptions = new Map([
    ['1 min', { step:60, display:{ hour: '2-digit', minute:'2-digit' } }],
    ['3 min', { step:180, display:{ hour: '2-digit', minute:'2-digit' } }],
    ['5 min', { step:300, display:{ hour: '2-digit', minute:'2-digit' } }],
    ['15 min', { step:900, display:{ hour: '2-digit', minute:'2-digit' } }],
    ['30 min', { step:1800, display:{ hour: '2-digit', minute:'2-digit' } }],
    ['1 hour', { step:3600, display:{ hour: '2-digit', minute:'2-digit' } }],
    ['2 hour', { step:7200, display:{ day: '2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' } }],
    ['4 hour', { step:14400, display:{ day: '2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' } }],
    ['6 hour', { step:21600, display:{day: '2-digit', month:'2-digit'} }],
    ['12 hour', { step: 43200, display:{day: '2-digit', month:'2-digit'} }],
    ['1 day', { step: 86400, display:{day: '2-digit', month:'2-digit'} }],
    ['3 day', { step: 259200, display:{day: '2-digit', month:'2-digit', year:'2-digit'} }]
])