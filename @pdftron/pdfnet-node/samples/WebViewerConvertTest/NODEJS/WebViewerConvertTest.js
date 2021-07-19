//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// The following sample illustrates how to convert PDF, XPS, image, MS Office, and 
// other image document formats to XOD.
//
// Certain file formats such as PDF, generic XPS, EMF, and raster image formats can 
// be directly converted to XOD. Other formats such as MS Office 
// (Word, Excel, Publisher, Powerpoint, etc) can be directly converted via interop. 
// These types of conversions guarantee optimal output, while preserving important 
// information such as document metadata, intra document links and hyper-links, 
// bookmarks etc. 
//
// In case there is no direct conversion available, PDFNet can still convert from 
// any printable document to XOD using a virtual printer driver. To check 
// if a virtual printer is required use Convert::RequiresPrinter(filename). In this 
// case the installing application must be run as administrator. The manifest for this 
// sample specifies appropriate the UAC elevation. The administrator privileges are 
// not required for direct or interop conversions. 
//
// Please note that PDFNet Publisher (i.e. 'pdftron.PDF.Convert.ToXod') is an
// optionally licensable add-on to PDFNet Core SDK. For details, please see
// http://www.pdftron.com/webviewer/licensing.html.
//---------------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runWebViewerConvertTest = () => {
    const inputPath = '../../TestFiles/';
    const outputPath = inputPath + 'Output/';
    const main = async () => {
      try {
        // Sample 1:
        // Directly convert from PDF to XOD.
        await PDFNet.Convert.fileToXod(inputPath + 'newsletter.pdf', outputPath + 'from_pdf.xod');

        // Sample 2:
        // Directly convert from generic XPS to XOD.
        await PDFNet.Convert.fileToXod(inputPath + 'simple-xps.xps', outputPath + 'from_xps.xod');

        // Sample 3:
        // Convert from MS Office (does not require printer driver for Office 2007+)
        // and other document formats to XOD.
        await bulkConvertRandomFilesToXod();
      } catch (err) {
        console.log(err.stack);
      }
    };

    let Testfile = function (inputFile, outputFile, requiresWindowsPlatform) {
      this.inputFile = inputFile;
      this.outputFile = outputFile;
      this.requiresWindowsPlatform = requiresWindowsPlatform;
    }

    const testfiles = [
      new Testfile('simple-powerpoint_2007.pptx', 'simple-powerpoint_2007.xod', true),
      new Testfile('simple-word_2007.docx', 'simple-word_2007.xod', true),
      new Testfile('butterfly.png', 'butterfly.xod', false),
      new Testfile('numbered.pdf', 'numbered.xod', false),
      new Testfile('dice.jpg', 'dice.xod', false),
      new Testfile('simple-xps.xps', 'simple-xps.xod', false),
    ]

    const bulkConvertRandomFilesToXod = async () => {
      let err = 0;
      if (process.platform === 'win32') {
        if (await PDFNet.Convert.printerIsInstalled('PDFTron PDFNet')) {
          await PDFNet.Convert.printerSetPrinterName('PDFTron PDFNet');
        } else if (!(await PDFNet.Convert.printerIsInstalled())) {
          try {
            // This will fail if not run as administrator. Harmless if PDFNet 
            // printer already installed
            console.log('Installing printer (requires Windows platform and administrator)');
            await PDFNet.Convert.printerUninstall();
            console.log('Installed printer ' + await PDFNet.Convert.printerGetPrinterName());
          } catch (exp) {
            console.log('Unable to install printer');
          }
        }
      }

      for (const testfile of testfiles)
      {
        if (process.platform !== 'win32' && testfile.requiresWindowsPlatform) {
          continue;
        }
        try {
          const inputFile = inputPath + testfile.inputFile;
          const outputFile = outputPath + testfile.outputFile;
          if (await PDFNet.Convert.requiresPrinter(inputFile)) {
            console.log('Using PDFNet printer to convert file ' + testfile.inputFile);
          }
          await PDFNet.Convert.fileToXod(inputFile, outputFile);
          console.log('Converted file: ' + testfile.inputFile + ' to: ' + testfile.outputFile);
        } catch (exp) {
          console.log('Unable to convert file ' + testfile.inputFile);
          console.log(exp);
          err = 1;
        }
      }

      if (err) {
        console.log('ConvertFile failed');
      } else {
        console.log('ConvertFile succeeded');
      }

      if (process.platform === 'win32' && await PDFNet.Convert.printerIsInstalled()) {
        try {
          console.log('Uninstalling printer (requires Windows platform and administrator)');
          await PDFNet.Convert.printerUninstall();
          console.log('Uninstalled Printer ' + await PDFNet.Convert.printerGetPrinterName());
        }
        catch (exp)
        {
          console.log('Unable to uninstall printer');
        }
      }
    }

    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function () { PDFNet.shutdown(); });
  };
  exports.runWebViewerConvertTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=WebViewerConvertTest.js