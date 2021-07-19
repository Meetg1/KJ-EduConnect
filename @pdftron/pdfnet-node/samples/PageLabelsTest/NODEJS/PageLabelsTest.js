//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------
// The sample illustrates how to work with PDF page labels.
//
// PDF page labels can be used to describe a page. This is used to 
// allow for non-sequential page numbering or the addition of arbitrary 
// labels for a page (such as the inclusion of Roman numerals at the 
// beginning of a book). PDFNet PageLabel object can be used to specify 
// the numbering style to use (for example, upper- or lower-case Roman, 
// decimal, and so forth), the starting number for the first page,
// and an arbitrary prefix to be pre-appended to each number (for 
// example, 'A-' to generate 'A-1', 'A-2', 'A-3', and so forth.)
//-----------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runPageLabelsTest = () => {
    const main = async () => {
      const inputPath = '../../TestFiles/';
      const outputPath = inputPath + 'Output/';
      const outputFile = outputPath + 'newsletter_with_pagelabels.pdf';

      try {
        //-----------------------------------------------------------
        // Example 1: Add page labels to an existing or newly created PDF
        // document.
        //-----------------------------------------------------------
        {
          const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
          doc.initSecurityHandler();

          // Create a page labeling scheme that starts with the first page in 
          // the document (page 1) and is using uppercase roman numbering 
          // style. 
          const L1 = await PDFNet.PageLabel.create(doc, PDFNet.PageLabel.Style.e_roman_uppercase, 'My Prefix ', 1);
          doc.setPageLabel(1, L1);

          // Create a page labeling scheme that starts with the fourth page in 
          // the document and is using decimal Arabic numbering style. 
          // Also the numeric portion of the first label should start with number 
          // 4 (otherwise the first label would be 'My Prefix 1'). 
          const L2 = await PDFNet.PageLabel.create(doc, PDFNet.PageLabel.Style.e_decimal, 'My Prefix ', 4);
          doc.setPageLabel(4, L2);

          // Create a page labeling scheme that starts with the seventh page in 
          // the document and is using alphabetic numbering style. The numeric 
          // portion of the first label should start with number 1. 
          const L3 = await PDFNet.PageLabel.create(doc, PDFNet.PageLabel.Style.e_alphabetic_uppercase, 'My Prefix ', 1);
          doc.setPageLabel(7, L3);

          doc.save(outputFile, PDFNet.SDFDoc.SaveOptions.e_linearized);
          console.log('Done. Result saved in newsletter_with_pagelabels.pdf...');
        }

        //-----------------------------------------------------------
        // Example 2: Read page labels from an existing PDF document.
        //-----------------------------------------------------------
        {
          const doc = await PDFNet.PDFDoc.createFromFilePath(outputFile);
          doc.initSecurityHandler();

          const page_num = await doc.getPageCount();
          for (let i = 1; i <= page_num; ++i) {
            console.log('Page number: ' + i);
            const label = await doc.getPageLabel(i);
            if (await label.isValid()) {
              console.log(' Label: ' + await label.getLabelTitle(i));
            }
            else {
              console.log(' No Label.');
            }
          }
        }

        //-----------------------------------------------------------
        // Example 3: Modify page labels from an existing PDF document.
        //-----------------------------------------------------------
        {
          const doc = await PDFNet.PDFDoc.createFromFilePath(outputFile);
          doc.initSecurityHandler();

          // Remove the alphabetic labels from example 1.
          doc.removePageLabel(7);

          // Replace the Prefix in the decimal labels (from example 1).
          const label = await doc.getPageLabel(4);
          if (await label.isValid()) {
            await label.setPrefix('A');
            label.setStart(1);
          }

          // Add a new label
          const new_label = await PDFNet.PageLabel.create(doc, PDFNet.PageLabel.Style.e_decimal, 'B', 1);
          doc.setPageLabel(10, new_label);  // starting from page 10.

          doc.save(outputPath + 'newsletter_with_pagelabels_modified.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
          console.log('Done. Result saved in newsletter_with_pagelabels_modified.pdf...');

          const page_num = await doc.getPageCount();
          for (let i = 1; i <= page_num; ++i) {
            console.log('Page number: ' + i);
            const label = await doc.getPageLabel(i);
            if (await label.isValid()) {
              console.log(' Label: ' + await label.getLabelTitle(i));
            }
            else {
              console.log(' No Label.');
            }
          }
        }

        //-----------------------------------------------------------
        // Example 4: Delete all page labels in an existing PDF document.
        //-----------------------------------------------------------
        {
          const doc = await PDFNet.PDFDoc.createFromFilePath(outputFile);
          (await doc.getRoot()).eraseFromKey('PageLabels');
        }

      } catch (err) {
        console.log(err);
      }
    }
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function(){ PDFNet.shutdown(); });
  };
  exports.runPageLabelsTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=PageLabelsTest.js