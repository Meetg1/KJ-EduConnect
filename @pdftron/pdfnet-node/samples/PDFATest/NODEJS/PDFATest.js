//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runPDFA = () => {

    const printResults = async (pdfa, filename) => {

      const errorCount = await pdfa.getErrorCount();
      if (errorCount === 0) {
        console.log(filename + ': OK.');
      } else {
        console.log(filename + ' is NOT a valid PDFA.');
        for (let i = 0; i < errorCount; i++) {
          const errorCode = await pdfa.getError(i);
          const errorMsg = await PDFNet.PDFACompliance.getPDFAErrorMessage(errorCode);
          console.log(' - e_PDFA ' + errorCode + ': ' + errorMsg + '.');
          const numRefs = await pdfa.getRefObjCount(errorCode);
          if (numRefs > 0) {
            const objs = [];
            for (let j = 0; j < numRefs; j++) {
              const objRef = await pdfa.getRefObj(errorCode, j);
              objs.push(objRef);
            }
            console.log('   Objects: ' + objs.join(', '));
          }
        }
        console.log('');
      }
    }

    //---------------------------------------------------------------------------------------
    // The following sample illustrates how to parse and check if a PDF document meets the
    //	PDFA standard, using the PDFACompliance class object. 
    //---------------------------------------------------------------------------------------
    const main = async () => {
      const inputPath = '../../TestFiles/';
      const outputPath = inputPath + 'Output/';
      await PDFNet.setColorManagement();  // Enable color management (required for PDFA validation).

      //-----------------------------------------------------------
      // Example 1: PDF/A Validation
      //-----------------------------------------------------------
      try {
        const filename = 'newsletter.pdf';
        /* The max_ref_objs parameter to the PDFACompliance constructor controls the maximum number 
        of object numbers that are collected for particular error codes. The default value is 10 
        in order to prevent spam. If you need all the object numbers, pass 0 for max_ref_objs. */
        const pdfa = await PDFNet.PDFACompliance.createFromFile(false, inputPath + filename, '', PDFNet.PDFACompliance.Conformance.e_Level2B);
        await printResults(pdfa, filename);
      } catch (err) {
        console.log(err);
      }

      //-----------------------------------------------------------
      // Example 2: PDF/A Conversion
      //-----------------------------------------------------------
      try {
        let filename = 'fish.pdf';
        const pdfa = await PDFNet.PDFACompliance.createFromFile(true, inputPath + filename, '', PDFNet.PDFACompliance.Conformance.e_Level2B);
        filename = 'pdfa.pdf';
        await pdfa.saveAsFromFileName(outputPath + filename);

        // Re-validate the document after the conversion...
        const comp = await PDFNet.PDFACompliance.createFromFile(false, outputPath + filename, '', PDFNet.PDFACompliance.Conformance.e_Level2B);
        await printResults(comp, filename);
      } catch (err) {
        console.log(err);
      }

      console.log('PDFACompliance test completed.')
    };

    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) { console.log('Error: ' + JSON.stringify(error)); }).then(function () { PDFNet.shutdown(); });
  };
  exports.runPDFA();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=PDFATest.js
