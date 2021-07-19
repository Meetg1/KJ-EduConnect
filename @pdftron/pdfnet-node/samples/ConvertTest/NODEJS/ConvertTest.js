//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// The following sample illustrates how to use the PDF::Convert utility class to convert 
// documents and files to PDF, XPS, SVG, or EMF.
//
// Certain file formats such as XPS, EMF, PDF, and raster image formats can be directly 
// converted to PDF or XPS. Other formats are converted using a virtual driver. To check 
// if ToPDF (or ToXPS) require that PDFNet printer is installed use Convert::RequiresPrinter(filename). 
// The installing application must be run as administrator. The manifest for this sample 
// specifies appropriate the UAC elevation.
//
// Note: the PDFNet printer is a virtual XPS printer supported on Vista SP1 and Windows 7.
// For Windows XP SP2 or higher, or Vista SP0 you need to install the XPS Essentials Pack (or 
// equivalent redistributables). You can download the XPS Essentials Pack from:
//		http://www.microsoft.com/downloads/details.aspx?FamilyId=B8DCFFDD-E3A5-44CC-8021-7649FD37FFEE&displaylang=en
// Windows XP Sp2 will also need the Microsoft Core XML Services (MSXML) 6.0:
// 		http://www.microsoft.com/downloads/details.aspx?familyid=993C0BCF-3BCF-4009-BE21-27E85E1857B1&displaylang=en
//
// Note: Convert.FromEmf and Convert.ToEmf will only work on Windows and require GDI+.
//
// Please contact us if you have any questions.	
//---------------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  let Testfile = function (inputFile, outputFile, requiresWindowsPlatform) {
    this.inputFile = inputFile;
    this.outputFile = outputFile;
    this.requiresWindowsPlatform = requiresWindowsPlatform;
  }

  const testfiles = [
    new Testfile('simple-word_2007.docx', 'docx2pdf.pdf', true),
    new Testfile('simple-powerpoint_2007.pptx', 'pptx2pdf.pdf', true),
    new Testfile('simple-excel_2007.xlsx', 'xlsx2pdf.pdf', true),
    new Testfile('simple-publisher.pub', 'pub2pdf.pdf', true),
    new Testfile('simple-text.txt', 'txt2pdf.pdf', true),
    new Testfile('simple-rtf.rtf', 'rtf2pdf.pdf', true),
    new Testfile('butterfly.png', 'png2pdf.pdf', false),
    new Testfile('simple-emf.emf', 'emf2pdf.pdf', true),
    new Testfile('simple-xps.xps', 'xps2pdf.pdf', false),
    new Testfile('simple-webpage.html', 'html2pdf.pdf', true),
  ]

  const inputPath = '../../TestFiles/';
  const outputPath = '../../TestFiles/Output/';

  exports.runConvertTest = () => {

    const main = async () => {
      try {
        await convertToPdfFromFile();
        console.log('ConvertFile succeeded');
      } catch (err) {
        console.log('ConvertFile failed');
        console.log(err);
      }

      try {
        await convertSpecificFormats();
        console.log('ConvertSpecificFormats succeeded');
      } catch (err) {
        console.log('ConvertSpecificFormats failed');
        console.log(err);
      }

      if (process.platform === 'win32' && await PDFNet.Convert.printerIsInstalled()) {
        try {
          console.log('Uninstalling printer (requires Windows platform and administrator)');
          await PDFNet.Convert.printerUninstall();
          console.log('Uninstalled printer ' + await PDFNet.Convert.printerGetPrinterName());
        } catch (err) {
          console.log('Unable to uninstall printer');
        }
      }

      console.log('Done.');
    };

    const convertToPdfFromFile = async () => {
      if (process.platform === 'win32') {
        if (await PDFNet.Convert.printerIsInstalled('PDFTron PDFNet')) {
          await PDFNet.Convert.printerSetPrinterName('PDFTron PDFNet');
        } else if (!(await PDFNet.Convert.printerIsInstalled())) {
          try {
            // This will fail if not run as administrator. Harmless if PDFNet 
            // printer already installed
            console.log('Installing printer (requires Windows platform and administrator)');
            await PDFNet.Convert.printerInstall();
            console.log('Installed printer ' + await PDFNet.Convert.printerGetPrinterName());
          } catch (err) {
            console.log('Unable to install printer');
          }
        }
      }

      for (const testfile of testfiles) {
        if (process.platform !== 'win32' && testfile.requiresWindowsPlatform) continue;

        try {
          const pdfdoc = await PDFNet.PDFDoc.create();
          await pdfdoc.initSecurityHandler();
          const inputFile = inputPath + testfile.inputFile;
          const outputFile = outputPath + testfile.outputFile;
          if (await PDFNet.Convert.requiresPrinter(inputFile)) {
            console.log('Using PDFNet printer to convert file ' + testfile.inputFile);
          }
          await PDFNet.Convert.toPdf(pdfdoc, inputFile);
          await pdfdoc.save(outputFile, PDFNet.SDFDoc.SaveOptions.e_linearized);
          console.log('Converted file: ' + testfile.inputFile + '\nto: ' + testfile.outputFile);
        } catch (err) {
          console.log('Unable to convert file ' + testfile.inputFile);
          console.log(err);
        }
      }
    };

    const convertSpecificFormats = async () => {
      try {
        const pdfdoc = await PDFNet.PDFDoc.create();
        await pdfdoc.initSecurityHandler();

        console.log('Converting from XPS');
        await PDFNet.Convert.fromXps(pdfdoc, inputPath + 'simple-xps.xps');
        await pdfdoc.save(outputPath + 'xps2pdf v2.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
        console.log('Saved xps2pdf v2.pdf');
      } catch (err) {
        console.log(err);
      }

      if (process.platform === 'win32') {
        try {
          const pdfdoc = await PDFNet.PDFDoc.create();
          await pdfdoc.initSecurityHandler();

          console.log('Converting from EMF');
          await PDFNet.Convert.fromEmf(pdfdoc, inputPath + 'simple-emf.emf');
          await pdfdoc.save(outputPath + 'emf2pdf v2.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
          console.log('Saved emf2pdf v2.pdf');
        } catch (err) {
          console.log(err);
        }
      }

      try {
        const pdfdoc = await PDFNet.PDFDoc.create();
        await pdfdoc.initSecurityHandler();

        // Add a dictionary
        const set = await PDFNet.ObjSet.create();
        const options = await set.createDict();

        // Put options
        options.putNumber('FontSize', 15);
        options.putBool('UseSourceCodeFormatting', true);
        options.putNumber('PageWidth', 12);
        await options.putNumber('PageHeight', 6);

        // Convert from .txt file
        console.log('Converting from txt');
        await PDFNet.Convert.fromText(pdfdoc, inputPath + 'simple-text.txt', options);
        await pdfdoc.save(outputPath + 'simple-text.pdf', PDFNet.SDFDoc.SaveOptions.e_remove_unused);
        console.log('Saved simple-text.pdf');
      } catch (err) {
        console.log(err);
      }

      try {
        const pdfdoc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        await pdfdoc.initSecurityHandler();

        // Convert PDF document to SVG
        console.log('Converting pdfdoc to SVG');
        await PDFNet.Convert.docToSvg(pdfdoc, outputPath + 'pdf2svg v2.svg');
        console.log('Saved pdf2svg v2.svg');
      } catch (err) {
        console.log(err);
      }

      try {
        // Convert PNG image to XPS
        console.log('Converting PNG to XPS');
        await PDFNet.Convert.fileToXps(inputPath + 'butterfly.png', outputPath + 'butterfly.xps');
        console.log('Saved butterfly.xps');
      } catch (err) {
        console.log(err);
      }

      if (process.platform === 'win32') {
        try {
		      // Convert MSWord document to XPS
		      console.log('Converting DOCX to XPS');
		      await PDFNet.Convert.fileToXps(inputPath + 'simple-word_2007.docx', outputPath + 'simple-word_2007.xps');
		      console.log('Saved simple-word_2007.xps');
        } catch (err) {
          console.log(err);
        }
      }

      try {
        // Convert PDF document to XPS
        console.log('Converting PDF to XPS');
        await PDFNet.Convert.fileToXps(inputPath + 'newsletter.pdf', outputPath + 'newsletter.xps');
        console.log('Saved newsletter.xps');
      } catch (err) {
        console.log(err);
      }

      try {
        // Convert PDF document to HTML
        console.log('Converting PDF to HTML');
        await PDFNet.Convert.fileToHtml(inputPath + 'newsletter.pdf', outputPath + 'newsletter');
        console.log('Saved newsletter as HTML');
      } catch (err) {
        console.log(err);
      }

      try {
        // Convert PDF document to EPUB
        console.log('Converting PDF to EPUB');
        await PDFNet.Convert.fileToEpub(inputPath + 'newsletter.pdf', outputPath + 'newsletter.epub');
        console.log('Saved newsletter.epub');
      } catch (err) {
        console.log(err);
      }

      try {
        // Convert PDF document to multipage TIFF
        console.log('Converting PDF to multipage TIFF');
        const tiff_options = new PDFNet.Convert.TiffOutputOptions();
        tiff_options.setDPI(200);
        tiff_options.setDither(true);
        tiff_options.setMono(true);
        
        await PDFNet.Convert.fileToTiff(inputPath + 'newsletter.pdf', outputPath + 'newsletter.tiff', tiff_options);
        console.log('Saved newsletter.tiff');
      } catch (err) {
        console.log(err);
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function(){ PDFNet.shutdown(); });
  };
  exports.runConvertTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=ConvertTest.js
