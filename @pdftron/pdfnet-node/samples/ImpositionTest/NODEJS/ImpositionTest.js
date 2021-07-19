//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------
// The sample illustrates how multiple pages can be combined/imposed 
// using PDFNet. Page imposition can be used to arrange/order pages 
// prior to printing or to assemble a 'master' page from several 'source' 
// pages. Using PDFNet API it is possible to write applications that can 
// re-order the pages such that they will display in the correct order 
// when the hard copy pages are compiled and folded correctly. 
//-----------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runImpositionTest = () => {
    const main = async () => {
      try {
        console.log('-------------------------------------------------');
        console.log('Opening the input pdf...');
        const in_doc = await PDFNet.PDFDoc.createFromFilePath('../../TestFiles/newsletter.pdf');
        in_doc.initSecurityHandler();

        // Create a list of pages to import from one PDF document to another.
        const import_pages = [];
        for (let itr = await in_doc.getPageIterator(); await itr.hasNext(); await itr.next()) {
          import_pages.push(await itr.current());
        }

        const new_doc = await PDFNet.PDFDoc.create();
        const imported_pages = await new_doc.importPages(import_pages);

        // Paper dimension for A3 format in points. Because one inch has 
        // 72 points, 11.69 inch 72 = 841.69 points
        const media_box = await PDFNet.Rect.init(0, 0, 1190.88, 841.69);
        const mid_point = await media_box.width() / 2;
        const builder = await PDFNet.ElementBuilder.create();
        const writer = await PDFNet.ElementWriter.create();
        for (let i = 0; i < imported_pages.length; ++i) {
          // Create a blank new A3 page and place on it two pages from the input document.
          const new_page = await new_doc.pageCreate(media_box);
          writer.beginOnPage(new_page);
          // Place the first page
          let src_page = imported_pages[i];
          var element = await builder.createFormFromPage(src_page);

          let sc_x = mid_point / await src_page.getPageWidth();
          let sc_y = await media_box.height() / await src_page.getPageHeight();
          let scale = sc_x < sc_y ? sc_x : sc_y; // min(sc_x, sc_y)
          await element.getGState().then(gstate => gstate.setTransform(scale, 0, 0, scale, 0, 0));
          writer.writePlacedElement(element);

          // Place the second page
          ++i;
          if (i < imported_pages.length) {
            src_page = imported_pages[i];
            element = await builder.createFormFromPage(src_page);
            sc_x = mid_point / await src_page.getPageWidth();
            sc_y = await media_box.height() / await src_page.getPageHeight();
            scale = sc_x < sc_y ? sc_x : sc_y; // min(sc_x, sc_y)
            await element.getGState().then(gstate => gstate.setTransform(scale, 0, 0, scale, mid_point, 0));
            writer.writePlacedElement(element);
          }

          await writer.end();
          new_doc.pagePushBack(new_page);
        }
        await new_doc.save('../../TestFiles/Output/newsletter_booklet.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
        console.log('Done. Result saved in newsletter_booklet.pdf...');

      } catch (err) {
        console.log(err);
      }
    }
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function(){ PDFNet.shutdown(); });
  };
  exports.runImpositionTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=ImpositionTest.js