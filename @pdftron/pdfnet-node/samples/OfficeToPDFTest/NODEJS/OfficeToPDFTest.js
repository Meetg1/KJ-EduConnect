//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// The following sample illustrates how to use the PDF::Convert utility class 
// to convert MS Office files to PDF
//
// This conversion is performed entirely within the PDFNet and has *no* 
// external or system dependencies dependencies -- Conversion results will be
// the same whether on Windows, Linux or Android.
//
// Please contact us if you have any questions.	
//------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runOfficeToPDF = () => {

    const inputPath = '../../TestFiles/';
    const outputPath = inputPath + 'Output/';

    const simpleDocxConvert = async (inputFilename, outputFilename) => {
      // perform the conversion with no optional parameters
      const pdfdoc = await PDFNet.Convert.officeToPdfWithPath(inputPath + inputFilename);

      // save the result
      await pdfdoc.save(outputPath + outputFilename, PDFNet.SDFDoc.SaveOptions.e_linearized);

      // And we're done!
      console.log('Saved ' + outputFilename);
    }

    const flexibleDocxConvert = async (inputFilename, outputFilename) => {
      // Start with a PDFDoc (the conversion destination)
      const pdfdoc = await PDFNet.PDFDoc.create();
      pdfdoc.initSecurityHandler();

      const options = new PDFNet.Convert.OfficeToPDFOptions();

      // set up smart font substitutions to improve conversion results
      // in situations where the original fonts are not available
      options.setSmartSubstitutionPluginPath(inputPath);

      // create a conversion object -- this sets things up but does not yet
      // perform any conversion logic.
      // in a multithreaded environment, this object can be used to monitor
      // the conversion progress and potentially cancel it as well
      const conversion = await PDFNet.Convert.streamingPdfConversionWithPdfAndPath(
        pdfdoc, inputPath + inputFilename, options);

      // Print the progress of the conversion.
      /*
            console.log('Status: ' + await conversion.getProgress() * 100 + '%, '
              + await conversion.getProgressLabel());
      */

      // actually perform the conversion
      // this particular method will not throw on conversion failure, but will
      // return an error status instead

      while (await conversion.getConversionStatus() === PDFNet.DocumentConversion.Result.e_Incomplete) {
        await conversion.convertNextPage();
        // print out the progress status as we go
        /*
                console.log('Status: ' + await conversion.getProgress() * 100 + '%, '
                  + await conversion.getProgressLabel());
        */
      }

      if (await conversion.getConversionStatus() === PDFNet.DocumentConversion.Result.e_Success) {
        const num_warnings = await conversion.getNumWarnings();

        // print information about the conversion 
        for (let i = 0; i < num_warnings; ++i) {
          console.log('Conversion Warning: ' + await conversion.getWarningString(i));
        }

        // save the result
        await pdfdoc.save(outputPath + outputFilename, PDFNet.SDFDoc.SaveOptions.e_linearized);
        // done
        console.log('Saved ' + outputFilename);
      }
      else {
        console.log('Encountered an error during conversion: '
          + await conversion.getErrorString());
      }
    }


    const main = async () => {

      PDFNet.addResourceSearchPath('../../Resources');

      try {
        // first the one-line conversion function
        await simpleDocxConvert('Fishermen.docx', 'Fishermen.pdf');

        // then the more flexible line-by-line conversion API
        await flexibleDocxConvert('the_rime_of_the_ancient_mariner.docx',
          'the_rime_of_the_ancient_mariner.pdf');

        // conversion of RTL content
        await flexibleDocxConvert('factsheet_Arabic.docx', 'factsheet_Arabic.pdf');
      } catch (err) {
        console.log(err);
      }

      console.log('Done.');
    };

    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function () { PDFNet.shutdown(); });

  };
  exports.runOfficeToPDF();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=OfficeToPDFTest.js
