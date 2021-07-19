//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------
/// This sample illustrates how to create, extract, and manipulate PDF Portfolios
/// (a.k.a. PDF Packages) using PDFNet SDK.
//-----------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runPDFPackageTest = () => {
    // Relative path to the folder containing test files.
    const inputPath = '../../TestFiles/';
    const outputPath = inputPath + 'Output/';

    const addPackage = async (doc, file, desc) => {
      const files = await PDFNet.NameTree.create(doc, 'EmbeddedFiles');
      const fs = await PDFNet.FileSpec.create(doc, file, true);
      files.put(file, await fs.getSDFObj());
      fs.setDesc(desc);

      const root = await doc.getRoot();
      var collection = await root.findObj('Collection');
      if (!collection) collection = await root.putDict('Collection');

      // You could here manipulate any entry in the Collection dictionary. 
      // For example, the following line sets the tile mode for initial view mode
      // Please refer to section '2.3.5 Collections' in PDF Reference for details.
      collection.putName('View', 'T');
    }

    const addCoverPage = async (doc) => {
      // Here we dynamically generate cover page (please see ElementBuilder 
      // sample for more extensive coverage of PDF creation API).
      const page = await doc.pageCreate(await PDFNet.Rect.init(0, 0, 200, 200));

      const b = await PDFNet.ElementBuilder.create();
      const w = await PDFNet.ElementWriter.create();
      w.beginOnPage(page);
      const font = await PDFNet.Font.create(doc, PDFNet.Font.StandardType1Font.e_helvetica);
      w.writeElement(await b.createTextBeginWithFont(font, 12));
      const e = await b.createNewTextRun('My PDF Collection');
      e.setTextMatrixEntries(1, 0, 0, 1, 50, 96);
      const gstate = await e.getGState();
      gstate.setFillColorSpace(await PDFNet.ColorSpace.createDeviceRGB());
      gstate.setFillColorWithColorPt(await PDFNet.ColorPt.init(1, 0, 0));
      w.writeElement(e);
      w.writeElement(await b.createTextEnd());
      w.end();
      doc.pagePushBack(page);

      // Alternatively we could import a PDF page from a template PDF document
      // (for an example please see PDFPage sample project).
    }

    const main = async () => {

      // Create a PDF Package.
      try {
        const doc = await PDFNet.PDFDoc.create();
        await addPackage(doc, inputPath + 'numbered.pdf', 'My File 1');
        await addPackage(doc, inputPath + 'newsletter.pdf', 'My Newsletter...');
        await addPackage(doc, inputPath + 'peppers.jpg', 'An image');
        await addCoverPage(doc);
        await doc.save(outputPath + 'package.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
        console.log('Done.');
      } catch (err) {
        console.log(err);
      }

      try {
        const doc = await PDFNet.PDFDoc.createFromFilePath(outputPath + 'package.pdf');
        await doc.initSecurityHandler();

        const files = await PDFNet.NameTree.find(doc, 'EmbeddedFiles');
        if (await files.isValid()) {
          // Traverse the list of embedded files.
          const i = await files.getIteratorBegin();
          for (var counter = 0; await i.hasNext(); await i.next(), ++counter) {
            const entry_name = await i.key().then(key => key.getAsPDFText());
            console.log('Part: ' + entry_name);
            const file_spec = await PDFNet.FileSpec.createFromObj(await i.value());
            const stm = await file_spec.getFileData();
            if (stm) {
              let ext = '.pdf';
              if (entry_name.includes('.')) {
                ext = entry_name.substr(entry_name.lastIndexOf('.'));
              }
              stm.writeToFile(outputPath + 'extract_' + counter + ext, false);
            }
          }
        }

        console.log('Done.');
      } catch (err) {
        console.log(err);
      }
    }
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function(){ PDFNet.shutdown(); });
  };
  exports.runPDFPackageTest();
})(exports);
  // eslint-disable-next-line spaced-comment
  //# sourceURL=PDFPackageTest.js