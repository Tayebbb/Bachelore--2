const AUTH_KEY = 'bachelore_auth'
const USER_KEY = 'bachelore_user'
const TOKEN_KEY = 'bachelore_token'
const ADMIN_AUTH_KEY = 'bachelore_admin_auth'
const EVENT = 'bachelore_auth_change'

export function isAuthed(){
  try{
    const authFlag = localStorage.getItem(AUTH_KEY) === '1'
    const token = localStorage.getItem(TOKEN_KEY)
    return authFlag && Boolean(token)
  }catch(e){ return false }
}

export function isAdminAuthed(){
  try{
    const token = getToken()
    if (!token) return false
    if (localStorage.getItem(ADMIN_AUTH_KEY) === '1') return true
    const user = getUser()
    return Boolean(user && user.role === 'admin')
  }catch(e){ return false }
}

export function login(){
  // call with user object to store user and set auth flag
  try{
    const user = arguments[0]
    const token = arguments[1]
    if(user && typeof user === 'object'){
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      localStorage.setItem(AUTH_KEY, '1')
      if (user.role === 'admin') {
        localStorage.setItem(ADMIN_AUTH_KEY, '1')
      } else {
        localStorage.removeItem(ADMIN_AUTH_KEY)
      }
    } else {
      localStorage.setItem(AUTH_KEY, '1')
    }
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    }
  }catch(e){}
  try{ window.dispatchEvent(new Event(EVENT)) }catch(e){}
}

export function adminLogin(user, token){
  try{
    localStorage.setItem(ADMIN_AUTH_KEY, '1')
    if (user && typeof user === 'object') {
      localStorage.setItem(USER_KEY, JSON.stringify({ ...user, role: 'admin' }))
    }
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    }
    localStorage.setItem(AUTH_KEY, '1')
  }catch(e){}
  try{ window.dispatchEvent(new Event(EVENT)) }catch(e){}
}

export function logout(){
  try{ localStorage.removeItem(AUTH_KEY); localStorage.removeItem(USER_KEY); localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(ADMIN_AUTH_KEY) }catch(e){}
  try{ window.dispatchEvent(new Event(EVENT)) }catch(e){}
}

export function getUser(){
  try{
    const v = localStorage.getItem(USER_KEY)
    if(!v) return null
    try{ return JSON.parse(v) }catch(e){ return null }
  }catch(e){ return null }
}

export function getUserRole(){
  const user = getUser()
  return String(user?.role || '').toLowerCase()
}

export function isStudentAuthed(){
  return isAuthed() && getUserRole() === 'student'
}

export function getToken(){
  try{ return localStorage.getItem(TOKEN_KEY) || '' }catch(e){ return '' }
}

export function onAuthChange(cb){
  window.addEventListener('storage', cb)
  window.addEventListener(EVENT, cb)
}

export function offAuthChange(cb){
  window.removeEventListener('storage', cb)
  window.removeEventListener(EVENT, cb)
}
