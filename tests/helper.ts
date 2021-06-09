import { getJwt } from '../src/tools/auth'

export const tokenPayload = {
  id: '60af9ae98deeb37b33df9d0d',
  name: 'user_1',
  email: 'test_1@example.email'
}

export const tokenPayloadUser2 = {
  id: '60af9ae98deeb37b33df9d0e',
  name: 'user_2',
  email: 'test_2@example.email'
}

export function getToken(payload?){
  return getJwt(payload || tokenPayload)
}

export const authorizedHeaders = {
  authorization: `Bearer ${getToken()}`
}
