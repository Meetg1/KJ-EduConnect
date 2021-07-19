//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------


const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runRectTest = () => {

    const main = async() => {
      try {
        console.log('_______________________________________________');
        console.log('Opening the input pdf...');

        const inputPath = '../../TestFiles/';
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'tiger.pdf');
        doc.initSecurityHandler();

        const pgItr1 = await doc.getPageIterator();
        const mediaBox = await (await pgItr1.current()).getMediaBox();
        mediaBox.x1 -= 200; // translate page 200 units left(1 uint = 1/72 inch)
        mediaBox.x2 -= 200;

        await mediaBox.update();

        await doc.save(inputPath + 'Output/tiger_shift.pdf', 0);
        console.log('Done. Result saved in tiger_shift...');
      } catch (err) {
        console.log(err);
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error){console.log('Error: ' + JSON.stringify(error));}).then(function(){PDFNet.shutdown();});
  };
  exports.runRectTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=AnnotationTest.js