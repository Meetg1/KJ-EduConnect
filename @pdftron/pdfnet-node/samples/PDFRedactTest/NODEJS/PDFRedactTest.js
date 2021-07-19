//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

// PDF Redactor is a separately licensable Add-on that offers options to remove 
// (not just covering or obscuring) content within a region of PDF. 
// With printed pages, redaction involves blacking-out or cutting-out areas of 
// the printed page. With electronic documents that use formats such as PDF, 
// redaction typically involves removing sensitive content within documents for 
// safe distribution to courts, patent and government institutions, the media, 
// customers, vendors or any other audience with restricted access to the content. 
//
// The redaction process in PDFNet consists of two steps:
// 
//  a) Content identification: A user applies redact annotations that specify the 
// pieces or regions of content that should be removed. The content for redaction 
// can be identified either interactively (e.g. using 'pdftron.PDF.PDFViewCtrl' 
// as shown in PDFView sample) or programmatically (e.g. using 'pdftron.PDF.TextSearch'
// or 'pdftron.PDF.TextExtractor'). Up until the next step is performed, the user 
// can see, move and redefine these annotations.
//  b) Content removal: Using 'pdftron.PDF.Redactor.Redact()' the user instructs 
// PDFNet to apply the redact regions, after which the content in the area specified 
// by the redact annotations is removed. The redaction function includes number of 
// options to control the style of the redaction overlay (including color, text, 
// font, border, transparency, etc.).
// 
// PDFTron Redactor makes sure that if a portion of an image, text, or vector graphics 
// is contained in a redaction region, that portion of the image or path data is 
// destroyed and is not simply hidden with clipping or image masks. PDFNet API can also 
// be used to review and remove metadata and other content that can exist in a PDF 
// document, including XML Forms Architecture (XFA) content and Extensible Metadata 
// Platform (XMP) content.

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runPDFRedactTest = () => {
    const redact = async(input, output, vec, app) => {
      const doc = await PDFNet.PDFDoc.createFromFilePath(input);
      if (await doc.initSecurityHandler()) {
        PDFNet.Redactor.redact(doc, vec, app, false, true);
        await doc.save(output, PDFNet.SDFDoc.SaveOptions.e_linearized);
      }
    };

    const main = async() => {
      // Relative path to the folder containing test files.
      const inputPath = '../../TestFiles/';
      try {
        const redactionArray = []; // we will contain a list of redaction objects in this array
        redactionArray.push(await PDFNet.Redactor.redactionCreate(1, (await PDFNet.Rect.init(100, 100, 550, 600)), false, 'Top Secret'));
        redactionArray.push(await PDFNet.Redactor.redactionCreate(2, (await PDFNet.Rect.init(30, 30, 450, 450)), true, 'Negative Redaction'));
        redactionArray.push(await PDFNet.Redactor.redactionCreate(2, (await PDFNet.Rect.init(0, 0, 100, 100)), false, 'Positive'));
        redactionArray.push(await PDFNet.Redactor.redactionCreate(2, (await PDFNet.Rect.init(100, 100, 200, 200)), false, 'Positive'));
        redactionArray.push(await PDFNet.Redactor.redactionCreate(2, (await PDFNet.Rect.init(300, 300, 400, 400)), false, ''));
        redactionArray.push(await PDFNet.Redactor.redactionCreate(2, (await PDFNet.Rect.init(500, 500, 600, 600)), false, ''));
        redactionArray.push(await PDFNet.Redactor.redactionCreate(3, (await PDFNet.Rect.init(0, 0, 700, 20)), false, ''));

        const appear = { redaction_overlay: true, border: false, show_redacted_content_regions: true };
        await redact(inputPath + 'newsletter.pdf', inputPath + 'Output/redacted.pdf', redactionArray, appear);

        console.log('Done...');
      } catch (err) {
        console.log(err.stack);
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error){console.log('Error: ' + JSON.stringify(error));}).then(function(){PDFNet.shutdown();});
  };
  exports.runPDFRedactTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=PDFRedactTest.js