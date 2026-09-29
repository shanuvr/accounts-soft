import client from './client'

const unwrap = (r) => r.data?.results ?? r.data

export const getPtdTemplates = () => client.get('/ptda/ptdatemplates/').then(unwrap)
export const getPtds = () => client.get('/ptda/ptdas/').then(unwrap)
export const getPtd = (id) => client.get(`/ptda/ptdas/${id}/`).then((r) => r.data)
export const createPtd = (data) => client.post('/ptda/ptdas/', data).then((r) => r.data)
export const updatePtd = (id, data) => client.patch(`/ptda/ptdas/${id}/`, data).then((r) => r.data)
export const deletePtd = (id) => client.delete(`/ptda/ptdas/${id}/`)