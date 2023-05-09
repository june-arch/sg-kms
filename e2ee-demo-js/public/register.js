// import "./e2ee.js";



// (async () => {
//   console.log("init");
//   async function processForm(e) {
//     if (e.preventDefault) e.preventDefault();

//     const publicKeyBase64 = document.getElementById("publicKey").value;
//     const publicKey = window.atob(publicKeyBase64);

//     // if (
//     //   document.getElementById("password-reg").value !=
//     //   document.getElementById("password-conf-reg").value
//     // ) {
//     //   alert("password mismatch");
//     //   return false;
//     // }

//     let message = sgkms.getBufferFromString(document.getElementById("password-reg").value);
//     let binaryPIN = await sgkms.e2eeEncrypt(publicKey, message);
//     const encodedBinaryPIN = window.btoa(
//       String.fromCharCode.apply(null, new Uint8Array(binaryPIN))
//     );
//     document.getElementById("password-reg").value = encodedBinaryPIN;

//     {
//       let message = sgkms.getBufferFromString(document.getElementById("password-conf-reg").value);
//       let binaryPIN = await sgkms.e2eeEncrypt(publicKey, message);
//       const encodedBinaryPIN = window.btoa(
//         String.fromCharCode.apply(null, new Uint8Array(binaryPIN))
//       );
//       document.getElementById("password-conf-reg").value = encodedBinaryPIN;
//     }

//     document.getElementById("my-form").submit();
//     return false;
//   }

//   const form = document.getElementById("my-form");
//   if (form.attachEvent) {
//     form.attachEvent("submit", processForm);
//   } else {
//     form.addEventListener("submit", processForm);
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

    let message = sgkms.getBufferFromString(
      document.getElementById("password-reg").value
    );
    let encodedBinaryPIN = await sgkms.e2eeEncrypt(publicKey, message);
    console.log(encodedBinaryPIN)
    console.log(publicKey)

    document.getElementById("password-reg").value = encodedBinaryPIN;

    {
      let message = sgkms.getBufferFromString(
        document.getElementById("password-conf-reg").value
      );
      let encodedBinaryPIN = await sgkms.e2eeEncrypt(publicKey, message);
      console.log(encodedBinaryPIN)

      document.getElementById("password-conf-reg").value = encodedBinaryPIN;
    }

    document.getElementById("my-form").submit();
    return false;
  }

  const form = document.getElementById("my-form");
  if (form.attachEvent) {
    form.attachEvent("submit", processForm);
  } else {
    form.addEventListener("submit", processForm);
  }
})();