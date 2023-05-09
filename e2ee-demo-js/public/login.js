// import "./e2ee.js";



// (async () => {

//   console.log("init");
//   async function processForm(e) {
//     if (e.preventDefault) e.preventDefault();

//     const publicKeyBase64 = document.getElementById("publicKey").value;
//     const publicKey = window.atob(publicKeyBase64);

//     // e2ee js function only accept byte array
//     let message = sgkms.getBufferFromString(document.getElementById("password-lgn").value);
//     let binaryPIN = await sgkms.e2eeEncrypt(publicKey, message);

//     const encodedBinaryPIN = window.btoa(
//       String.fromCharCode.apply(null, new Uint8Array(binaryPIN))
//     );
//     console.log(encodedBinaryPIN);

//     document.getElementById("password-lgn").value = encodedBinaryPIN;
//     document.getElementById("login-form").submit();
//     return false;
//   }

//   const loginForm = document.getElementById("login-form");
//   if (loginForm.attachEvent) {
//     loginForm.attachEvent("submit", processForm);
//   } else {
//     loginForm.addEventListener("submit", processForm);
//   }
// })();


import "./e2ee.js";

/*
    Convert a string into an ArrayBuffer
    from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
const str2ab = (str) => {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

(async () => {
  console.log("init");
  async function processForm(e) {
    if (e.preventDefault) e.preventDefault();

    const publicKeyBase64 = document.getElementById("publicKey").value;
    const publicKey = window.atob(publicKeyBase64);

    // e2ee js function only accept byte array
    let message = sgkms.getBufferFromString(document.getElementById("password-lgn").value);
    let encodedBinaryPIN = await sgkms.e2eeEncrypt(publicKey, message);

    document.getElementById("password-lgn").value = encodedBinaryPIN;
    document.getElementById("login-form").submit();
    return false;
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm.attachEvent) {
    loginForm.attachEvent("submit", processForm);
  } else {
    loginForm.addEventListener("submit", processForm);
  }
})();