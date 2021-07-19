## @pdftron/pdfnet-node

This package leverages the full power of PDFTron's native SDK for maximal performance and accuracy. In order to maintain consistency across platforms the Javascript API is used in the same manner as the PDFNet API available in PDFTron's Web platform. Since access to the filesystem is included in Node.js/Electron some additional APIs requiring filesystem access have also been included.

#### Supported platform, Node.js, and Electron versions
This package depends on unmanaged add-on binaries, and the add-on binaries are not cross-platform. At the moment we have support for
  * **OS**: Linux(x64) excluding Alpine, Windows(x64), Mac
  * **Node.js version**: 8 - 16
  * **Electron version**: 6 - 12
 
Installation will fail if your OS, Node.js or Electron version is not supported.

To install for Electron, *runtime* and *target* options are needed. For example, For Electron 6, we need to run  *npm i @pdftron/pdfnet-node --runtime=electron --target=6.0.0*. Note that we need to use *6.0.0* for all Electron 6 versions.

#### Usage
Here is a code snippet to demonstrate how to use this package.
```javascript
const { PDFNet } = require('@pdftron/pdfnet-node');  // you may need to set up NODE_PATH environment variable to make this work.

const main = async() => {
  const doc = await PDFNet.PDFDoc.create();
  const page = await doc.pageCreate();
  doc.pagePushBack(page);
  doc.save('blank.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
};

// add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
PDFNet.runWithCleanup(main).catch(function(error) {
  console.log('Error: ' + JSON.stringify(error));
}).then(function(){ PDFNet.shutdown(); });
```

There are some code samples in the *@pdftron/pdfnet-node/samples* directory after the installation for Node.js.

To get started please see the documentation at https://www.pdftron.com/documentation/nodejs/get-started/integration.

#### Licensing
Visit https://www.pdftron.com/licensing to license PDFTron SDK.