//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

// This sample illustrates how to use basic SDF API (also known as Cos) to edit an 
// existing document.

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runSDFTest = () => {

    const main = async() => {
      // Relative path to the folder containing test files.
      const inputPath = '../../TestFiles/';

      try {
        console.log('Opening the test file...');
        // Here we create a SDF/Cos document directly from PDF file. In case you have
        // PDFDoc you can always access SDF/Cos document using PDFDoc.GetSDFDoc() method.
        const docorig = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'fish.pdf');
        const doc = await docorig.getSDFDoc();
        doc.initSecurityHandler();
        console.log('Modifying into dictionary, adding custom properties, embedding a stream...');

        const trailer = await doc.getTrailer(); // Get the trailer

        // Now we will change PDF document information properties using SDF API

        // Get the Info dictionary.

        let itr = await trailer.find('Info');
        let info;
        if (await itr.hasNext()) {
          info = await itr.value();
          // Modify 'Producer' entry.
          info.putString('Producer', 'PDFTron PDFNet');

          // read title entry if it is present
          itr = await info.find('Author');
          if (await itr.hasNext()) {
            const itrval = await itr.value();
            const oldstr = await itrval.getAsPDFText();
            info.putText('Author', oldstr + ' - Modified');
          } else {
            info.putString('Author', 'Me, myself, and I');
          }
        } else {
          // Info dict is missing.
          info = await trailer.putDict('Info');
          info.putString('Producer', 'PDFTron PDFNet');
          info.putString('Title', 'My document');
        }

        // Create a custom inline dictionary within Infor dictionary
        const customDict = await info.putDict('My Direct Dict');
        customDict.putNumber('My Number', 100); // Add some key/value pairs
        customDict.putArray('My Array');

        // Create a custom indirect array within Info dictionary
        const customArray = await doc.createIndirectArray();
        info.put('My Indirect Array', customArray); // Add some entries

        // create indirect link to root
        const trailerRoot = await trailer.get('Root');
        customArray.pushBack((await trailerRoot.value()));

        // Embed a custom stream (file mystream.txt).
        const embedFile = await PDFNet.Filter.createMappedFileFromUString(inputPath + 'my_stream.txt');
        const mystm = await PDFNet.FilterReader.create(embedFile);
        const indStream = await doc.createIndirectStreamFromFilter(mystm);
        customArray.pushBack(indStream);

        console.log('Saving modified test file...');
        await doc.save(inputPath + 'Output/sdftest_out.pdf', 0, '%PDF-1.4');
        console.log('Test completed.');
      } catch (err) {
        console.log(err);
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error){console.log('Error: ' + JSON.stringify(error));}).then(function(){PDFNet.shutdown();});
  };
  exports.runSDFTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=SDFTest.js