//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------
// This sample illustrates one approach to PDF image extraction 
// using PDFNet.
// 
// Note: Besides direct image export, you can also convert PDF images 
// to GDI+ Bitmap, or extract uncompressed/compressed image data directly 
// using element.GetImageData() (e.g. as illustrated in ElementReaderAdv 
// sample project).
//-----------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runImageExtractTest = () => {

    let image_counter = 0;
    const outputPath = '../../TestFiles/Output/';

    const imageExtract = async (reader) => {
      let element;
      while ((element = await reader.next()) !== null) {
        switch (await element.getType()) {
          case PDFNet.Element.Type.e_image:
          case PDFNet.Element.Type.e_inline_image:
            console.log('--> Image: ' + ++image_counter);
            console.log('    Width: ' + await element.getImageWidth());
            console.log('    Height: ' + await element.getImageHeight());
            console.log('    BPC: ' + await element.getBitsPerComponent());

            const ctm = await element.getCTM();
            let x2 = 1, y2 = 1;
            const result = await ctm.mult(x2, y2);
            x2 = result.x;
            y2 = result.y;
            console.log('    Coords: x1=' + ctm.m_h.toFixed(2) + ', y1=' + ctm.m_v.toFixed(2)
             + ', x2=' + x2.toFixed(2) + ', y2=' + y2.toFixed(2));

            if (await element.getType() == PDFNet.Element.Type.e_image) {
              const image = await PDFNet.Image.createFromObj(await element.getXObject());
              image.export(outputPath + 'image_extract1_' + image_counter);
            }
            break;
          case PDFNet.Element.Type.e_form: // Process form XObjects
            reader.formBegin();
            await imageExtract(reader);
            reader.end();
            break;
        }
      }
    }

    const main = async () => {

      // Example 1: 
      // Extract images by traversing the display list for 
      // every page. With this approach it is possible to obtain 
      // image positioning information and DPI.
      try {
        const doc = await PDFNet.PDFDoc.createFromFilePath('../../TestFiles/newsletter.pdf');
        doc.initSecurityHandler();

        const reader = await PDFNet.ElementReader.create();
        const itr = await doc.getPageIterator(1);
        // Read every page
        for (itr; await itr.hasNext(); await itr.next()) {
          const page = await itr.current();
          reader.beginOnPage(page);
          await imageExtract(reader);
          reader.end();
        }

        console.log('Done.');
      } catch (err) {
        console.log(err);
      }

      console.log('----------------------------------------------------------------');

      // Example 2: 
      // Extract images by scanning the low-level document.
      try {
        const doc = await PDFNet.PDFDoc.createFromFilePath('../../TestFiles/newsletter.pdf');
        doc.initSecurityHandler();
        image_counter = 0;

        const cos_doc = await doc.getSDFDoc();
        const num_objs = await cos_doc.xRefSize();
        for (var i = 0; i < num_objs; i++) {
          const obj = await cos_doc.getObj(i);
          if (obj && !(await obj.isFree()) && await obj.isStream()) {
            // Process only images
            var itr = await obj.find('Type');
            if (!(await itr.hasNext()) || await (await itr.value()).getName() !== 'XObject')
              continue;

            itr = await obj.find('Subtype');
            if (!(await itr.hasNext()) || await (await itr.value()).getName() !== 'Image')
              continue;
            const image = await PDFNet.Image.createFromObj(obj);
            console.log('--> Image: ' + ++image_counter);
            console.log('    Width: ' + await image.getImageWidth());
            console.log('    Height: ' + await image.getImageHeight());
            console.log('    BPC: ' + await image.getBitsPerComponent());

            image.export(outputPath + 'image_extract2_' + image_counter);
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
  exports.runImageExtractTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=ImageExtractTest.js