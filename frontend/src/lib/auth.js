const AUTH_KEY = 'bachelore_auth'
const USER_KEY = 'bachelore_user'
const EVENT = 'bachelore_auth_change'

export function isAuthed(){
  try{ return localStorage.getItem(AUTH_KEY) === '1' }catch(e){ return false }
}

export function login(){
  // call with user object to store user and set auth flag
  try{
    const user = arguments[0]
    if(user && typeof user === 'object'){
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      localStorage.setItem(AUTH_KEY, '1')
    } else {
      localStorage.setItem(AUTH_KEY, '1')
    }
  }catch(e){}
  try{ window.dispatchEvent(new Event(EVENT)) }catch(e){}
}

export function logout(){
  try{ localStorage.removeItem(AUTH_KEY); localStorage.removeItem(USER_KEY) }catch(e){}
  try{ window.dispatchEvent(new Event(EVENT)) }catch(e){}
}

export function getUser(){
  try{
    const v = localStorage.getItem(USER_KEY)
    if(!v) return null
    try{ return JSON.parse(v) }catch(e){ return null }
  }catch(e){ return null }
}

export function onAuthChange(cb){
  window.addEventListener('storage', cb)
  window.addEventListener(EVENT, cb)
}

export function offAuthChange(cb){
  window.removeEventListener('storage', cb)
  window.removeEventListener(EVENT, cb)
}
