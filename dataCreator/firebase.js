import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'
// import {getAuth as _getAuth, signInWithRedirect as _signInWithRedirect, signInWithPopup as _signInWithPopup, GoogleAuthProvider, onAuthStateChanged as _onAuthStateChange} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js'
import {getDatabase as _getDatabase, child, push, ref as _ref, update, get, onValue, onChildAdded, onChildChanged, onChildRemoved, set, off} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js"

const CONFIG = {
    "apiKey": "AIzaSyAwKRqxNdoO05hLlGZwb5AgWugSBzruw6A",
    "authDomain": "myaccounts-4a6c7.firebaseapp.com",
    "databaseURL": "https://myaccounts-4a6c7-default-rtdb.asia-southeast1.firebasedatabase.app",
    "projectId": "myaccounts-4a6c7",
    "storageBucket": "myaccounts-4a6c7.appspot.com",
    "messagingSenderId": "678570989696",
    "appId": "1:678570989696:web:ca70c09476d4c5f627ee65"
}

console.log("here");
const App = initializeApp(CONFIG);
const Database = _getDatabase(App);
// const Auth = _getAuth();

// async function signInWithPopup(provider) { return await _signInWithPopup(Auth, provider) }

function getApp() {return App}
function getDatabase() {return Database}
// function getAuth() {return Auth}
function ref(path) {return _ref(Database, path)}
// function signInWithRedirect(provider) {return _signInWithRedirect(Auth, provider)}
// function onAuthStateChanged(callback) {return _onAuthStateChange(Auth, callback)}

// export {child, push, update, get, onValue, onChildAdded, onChildChanged, onChildRemoved, set, off, GoogleAuthProvider, getApp, getDatabase, getAuth, ref, signInWithRedirect, onAuthStateChanged, signInWithPopup }

export function saveData(target, data) {
    let data_ref = push(ref(`ASL/${target}`));
    set(data_ref, data);
}