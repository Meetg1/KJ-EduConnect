//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------
// The following sample illustrates how to convert CAD documents to PDF format 
// 
// The CAD module is an optional PDFNet Add-on that can be used to convert CAD
// documents into PDF documents
//
// The PDFTron SDK CAD module can be downloaded from http://www.pdftron.com/
//---------------------------------------------------------------------------------------


const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runCAD2PDFTest = () => {
    const IsRVTFile = function (inputFile) {
      var rvt_input = false;
      if (inputFile.length > 2) {
        if (inputFile.substr(inputFile.length - 3, 3) === 'rvt') {
          rvt_input = true;
        }
      }
      return rvt_input;
    }

    const main = async () => {
      try {
        await PDFNet.addResourceSearchPath('../../../lib/');
        if (!(await PDFNet.CADModule.isModuleAvailable())) {
          console.log('\nUnable to run CAD2PDFTest: PDFTron SDK CAD module not available.');
          console.log('---------------------------------------------------------------');
          console.log('The CAD module is an optional add-on, available for download');
          console.log('at http://www.pdftron.com/. If you have already downloaded this');
          console.log('module, ensure that the SDK is able to find the required files');
          console.log('using the PDFNet.addResourceSearchPath() function.\n');

          return;
        }

        // Relative path to the folder containing test files.
        const inputPath = '../../TestFiles/CAD/';
        const outputPath = '../../TestFiles/Output/';

        const input_file_name = 'construction drawings color-28.05.18.dwg';
        const output_file_name = 'construction drawings color-28.05.18.pdf';

        const doc = await PDFNet.PDFDoc.create();
        doc.initSecurityHandler();

        if (IsRVTFile(input_file_name)) {
          const opts = new PDFNet.Convert.CADConvertOptions();
					opts.setPageWidth(800);
					opts.setPageHeight(600);
					opts.setRasterDPI(150);
          await PDFNet.Convert.fromCAD(doc, inputPath + input_file_name, opts);
        } else {
          await PDFNet.Convert.fromCAD(doc, inputPath + input_file_name);
        }
        const outputFile = outputPath + output_file_name;
        await doc.save(outputFile, PDFNet.SDFDoc.SaveOptions.e_linearized);
      } catch (err) {
        console.log(err);
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function(){ PDFNet.shutdown(); });
  };
  exports.runCAD2PDFTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=CAD2PDFTest.js