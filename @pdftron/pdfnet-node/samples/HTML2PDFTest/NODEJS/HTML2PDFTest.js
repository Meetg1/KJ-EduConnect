//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// The following sample illustrates how to convert HTML pages to PDF format using
// the HTML2PDF class.
// 
// 'pdftron.PDF.HTML2PDF' is an optional PDFNet Add-On utility class that can be 
// used to convert HTML web pages into PDF documents by using an external module (html2pdf).
//
// html2pdf modules can be downloaded from http://www.pdftron.com/pdfnet/downloads.html.
//
// Users can convert HTML pages to PDF using the following operations:
// - Simple one line static method to convert a single web page to PDF. 
// - Convert HTML pages from URL or string, plus optional table of contents, in user defined order. 
// - Optionally configure settings for proxy, images, java script, and more for each HTML page. 
// - Optionally configure the PDF output, including page size, margins, orientation, and more. 
// - Optionally add table of contents, including setting the depth and appearance.
//---------------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runHTML2PDFTest = () => {
    const main = async () => {
      const outputPath = '../../TestFiles/Output/html2pdf_example';
      const host = 'http://www.gutenberg.org/';
      const page0 = 'wiki/Main_Page';
      const page1 = 'catalog/';
      const page2 = 'browse/recent/last1';
      const page3 = 'wiki/Gutenberg:The_Sheet_Music_Project';

	// For HTML2PDF we need to locate the html2pdf module. If placed with the 
	// PDFNet library, or in the current working directory, it will be loaded
	// automatically. Otherwise, it must be set manually using HTML2PDF.setModulePath.
      await PDFNet.HTML2PDF.setModulePath('../../../lib/');

      //--------------------------------------------------------------------------------
      // Example 1) Simple conversion of a web page to a PDF doc. 

      try {
        const html2pdf = await PDFNet.HTML2PDF.create();
        const doc = await PDFNet.PDFDoc.create();

        html2pdf.insertFromUrl(host.concat(page0));
        // now convert a web page, sending generated PDF pages to doc
        if (await html2pdf.convert(doc)) {
          doc.save(outputPath.concat('_01.pdf'), PDFNet.SDFDoc.SaveOptions.e_linearized);
        } else {
          console.log('Conversion failed.');
        }
      } catch (err) {
        console.log(err);
      }

      //--------------------------------------------------------------------------------
      // Example 2) Modify the settings of the generated PDF pages and attach to an
      // existing PDF document. 

      try {
        // open the existing PDF, and initialize the security handler
        const doc = await PDFNet.PDFDoc.createFromFilePath('../../TestFiles/numbered.pdf');
        await doc.initSecurityHandler();

        // create the HTML2PDF converter object and modify the output of the PDF pages
        const html2pdf = await PDFNet.HTML2PDF.create();
        html2pdf.setImageQuality(25);
        html2pdf.setPaperSize(PDFNet.PrinterMode.PaperSize.e_11x17);

        // insert the web page to convert
        html2pdf.insertFromUrl(host.concat(page0));
        // convert the web page, appending generated PDF pages to doc
        if (await html2pdf.convert(doc)) {
          doc.save(outputPath.concat('_02.pdf'), PDFNet.SDFDoc.SaveOptions.e_linearized);
        } else {
          console.log('conversion failed. HTTP Code: ' + await html2pdf.getHttpErrorCode());
          console.log(await html2pdf.getLog());
        }
      } catch (err) {
        console.log(err);
      }

      //--------------------------------------------------------------------------------
      // Example 3) Convert multiple web pages, adding a table of contents, and setting
      // the first page as a cover page, not to be included with the table of contents outline. 

      try {
        // Add a cover page, which is excluded from the outline, and ignore any errors
        const cover = await PDFNet.HTML2PDF.WebPageSettings.create();
        cover.setLoadErrorHandling(PDFNet.HTML2PDF.WebPageSettings.ErrorHandling.e_ignore);
        await cover.setIncludeInOutline(false);

        const html2pdf = await PDFNet.HTML2PDF.create();
        html2pdf.insertFromUrl2(host.concat(page3), cover);

        // Add a table of contents settings (modifying the settings is optional)
        const toc = await PDFNet.HTML2PDF.TOCSettings.create();
        await toc.setDottedLines(false);
        html2pdf.insertTOC2(toc);

        // Now add the rest of the web pages, disabling external links and 
        // skipping any web pages that fail to load.
        //
        // Note that the order of insertion matters, so these will appear
        // after the cover and table of contents, in the order below.
        const settings = await PDFNet.HTML2PDF.WebPageSettings.create();
        settings.setLoadErrorHandling(PDFNet.HTML2PDF.WebPageSettings.ErrorHandling.e_skip);
        await settings.setExternalLinks(false);

        html2pdf.insertFromUrl2(host.concat(page0), settings);
        html2pdf.insertFromUrl2(host.concat(page1), settings);
        html2pdf.insertFromUrl2(host.concat(page2), settings);

        const doc = await PDFNet.PDFDoc.create();
        if (await html2pdf.convert(doc)) {
          doc.save(outputPath.concat('_03.pdf'), PDFNet.SDFDoc.SaveOptions.e_linearized);
        } else {
          console.log('conversion failed. HTTP Code: ' + await html2pdf.getHttpErrorCode());
          console.log(await html2pdf.getLog());
        }
      } catch (err) {
        console.log(err);
      }

      //--------------------------------------------------------------------------------
      // Example 4) Convert HTML string to PDF. 

      try {
        const html2pdf = await PDFNet.HTML2PDF.create();
        const doc = await PDFNet.PDFDoc.create();
        const html = '<html><body><h1>Heading</h1><p>Paragraph.</p></body></html>'

        html2pdf.insertFromHtmlString(html);
        if (await html2pdf.convert(doc)) {
          doc.save(outputPath.concat('_04.pdf'), PDFNet.SDFDoc.SaveOptions.e_linearized);
        } else {
          console.log('conversion failed. HTTP Code: ' + await html2pdf.getHttpErrorCode());
          console.log(await html2pdf.getLog());
        }
      } catch (err) {
        console.log(err);
      }

      console.log('Test Complete!');
    }
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function(){ PDFNet.shutdown(); });
  };
  exports.runHTML2PDFTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=HTML2PDFTest.js