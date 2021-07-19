//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// The following sample shows how to add new content (or watermark) PDF pages
// using 'pdftron.PDF.Stamper' utility class. 
//
// Stamper can be used to PDF pages with text, images, or with other PDF content 
// in only a few lines of code. Although Stamper is very simple to use compared 
// to ElementBuilder/ElementWriter it is not as powerful or flexible. In case you 
// need full control over PDF creation use ElementBuilder/ElementWriter to add 
// new content to existing PDF pages as shown in the ElementBuilder sample project.
//---------------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runStamperTest = () => {

    const main = async () => {
      // Relative path to the folder containing test files.
      const inputPath = '../../TestFiles/';
      const outputPath = inputPath + 'Output/';

      //--------------------------------------------------------------------------------
      // Example 1) Add text stamp to all pages, then remove text stamp from odd pages. 
      try {
        // start stack-based deallocation with startDeallocateStack. Later on when endDeallocateStack is called,
        // all objects in memory that were initialized since the most recent startDeallocateStack call will be
        // cleaned up. Doing this makes sure that memory growth does not get too high.
        await PDFNet.startDeallocateStack();

        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        doc.initSecurityHandler();

        const stamper = await PDFNet.Stamper.create(PDFNet.Stamper.SizeType.e_relative_scale, 0.5, 0.5); // Stamp size is relative to the size of the crop box of the destination page
        stamper.setAlignment(PDFNet.Stamper.HorizontalAlignment.e_horizontal_center, PDFNet.Stamper.VerticalAlignment.e_vertical_center);

        const redColorPt = await PDFNet.ColorPt.init(1, 0, 0);
        stamper.setFontColor(redColorPt);
        const pgSet = await PDFNet.PageSet.createRange(1, (await doc.getPageCount()));
        stamper.stampText(doc, 'If you are reading this\nthis is an even page', pgSet);
        const oddPgSet = await PDFNet.PageSet.createFilteredRange(1, (await doc.getPageCount()), PDFNet.PageSet.Filter.e_odd);
        // delete all text stamps in odd pages
        PDFNet.Stamper.deleteStamps(doc, oddPgSet);

        await doc.save(outputPath + 'newsletter.ex1.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);

        await PDFNet.endDeallocateStack();
      } catch (err) {
        console.log(err.stack);
      }

      //--------------------------------------------------------------------------------
      // Example 2) Add Image stamp to first 2 pages. 
      try {
        await PDFNet.startDeallocateStack();
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        doc.initSecurityHandler();

        const stamper = await PDFNet.Stamper.create(PDFNet.Stamper.SizeType.e_relative_scale, 0.5, 0.5);
        const img = await PDFNet.Image.createFromFile(doc, inputPath + 'peppers.jpg');
        stamper.setSize(PDFNet.Stamper.SizeType.e_relative_scale, 0.5, 0.5);
        // set position of the image to the center, left of PDF pages
        stamper.setAlignment(PDFNet.Stamper.HorizontalAlignment.e_horizontal_left, PDFNet.Stamper.VerticalAlignment.e_vertical_center);

        const blackColorPt = await PDFNet.ColorPt.init(0, 0, 0, 0);
        stamper.setFontColor(blackColorPt);
        stamper.setRotation(180);
        stamper.setAsBackground(false);
        // only stamp first 2 pages
        const pgSet = await PDFNet.PageSet.createRange(1, 2);
        stamper.stampImage(doc, img, pgSet);

        await doc.save(outputPath + 'newsletter.ex2.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
        await PDFNet.endDeallocateStack();
      } catch (err) {
        console.log(err.stack);
      }

      //--------------------------------------------------------------------------------
      // Example 3) Add Page stamp to all pages. 
      try {
        await PDFNet.startDeallocateStack();
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        doc.initSecurityHandler();
        const fishDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'fish.pdf');
        fishDoc.initSecurityHandler();

        const stamper = await PDFNet.Stamper.create(PDFNet.Stamper.SizeType.e_relative_scale, 0.5, 0.5);
        const srcPage = await fishDoc.getPage(1);
        const pageOneCrop = await srcPage.getCropBox();
        // set size of the image to 10% of the original while keep the old aspect ratio
        stamper.setSize(PDFNet.Stamper.SizeType.e_absolute_size, (await pageOneCrop.width()) * 0.1, -1);
        stamper.setOpacity(0.4);
        stamper.setRotation(-67);

        // put the image at the bottom right hand corner
        stamper.setAlignment(PDFNet.Stamper.HorizontalAlignment.e_horizontal_right, PDFNet.Stamper.VerticalAlignment.e_vertical_bottom);
        const pgSet = await PDFNet.PageSet.createRange(1, (await doc.getPageCount()));
        stamper.stampPage(doc, srcPage, pgSet);

        await doc.save(outputPath + 'newsletter.ex3.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
        await PDFNet.endDeallocateStack();
      } catch (err) {
        console.log(err.stack);
      }

      //--------------------------------------------------------------------------------
      // Example 4) Add Image stamp to first 20 odd pages.
      try {
        await PDFNet.startDeallocateStack();
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        doc.initSecurityHandler();

        const stamper = await PDFNet.Stamper.create(PDFNet.Stamper.SizeType.e_absolute_size, 20, 20);
        stamper.setOpacity(1);
        stamper.setRotation(45);
        stamper.setAsBackground(true);
        stamper.setPosition(30, 40);
        const img = await PDFNet.Image.createFromFile(doc, inputPath + 'peppers.jpg');

        const pgSet = await PDFNet.PageSet.createFilteredRange(1, 20, PDFNet.PageSet.Filter.e_odd);
        stamper.stampImage(doc, img, pgSet);

        await doc.save(outputPath + 'newsletter.ex4.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
        await PDFNet.endDeallocateStack();
      } catch (err) {
        console.log(err.stack);
      }

      //--------------------------------------------------------------------------------
      // Example 5) Add text stamp to first 20 even pages
      try {
        await PDFNet.startDeallocateStack();

        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        doc.initSecurityHandler();

        const stamper = await PDFNet.Stamper.create(PDFNet.Stamper.SizeType.e_relative_scale, 0.05, 0.05);
        stamper.setPosition(0, 0);
        stamper.setOpacity(0.7);
        stamper.setRotation(90);
        stamper.setSize(PDFNet.Stamper.SizeType.e_font_size, 80, -1);
        stamper.setTextAlignment(PDFNet.Stamper.TextAlignment.e_align_center);
        const pgSet = await PDFNet.PageSet.createFilteredRange(1, 20, PDFNet.PageSet.Filter.e_even);
        stamper.stampText(doc, 'Goodbye\nMoon', pgSet);

        await doc.save(outputPath + 'newsletter.ex5.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);

        await PDFNet.endDeallocateStack();
      } catch (err) {
        console.log(err.stack);
      }

      //--------------------------------------------------------------------------------
      // Example 6) Add first page as stamp to all even pages
      try {
        await PDFNet.startDeallocateStack();

        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        doc.initSecurityHandler();

        const fishDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'fish.pdf');
        fishDoc.initSecurityHandler();

        const stamper = await PDFNet.Stamper.create(PDFNet.Stamper.SizeType.e_relative_scale, 0.3, 0.3);
        stamper.setOpacity(1);
        stamper.setRotation(270);
        stamper.setAsBackground(true);
        stamper.setPosition(0.5, 0.5, true);
        stamper.setAlignment(PDFNet.Stamper.HorizontalAlignment.e_horizontal_left, PDFNet.Stamper.VerticalAlignment.e_vertical_bottom);
        const pgOne = await fishDoc.getPage(1);
        const pgSet = await PDFNet.PageSet.createFilteredRange(1, await doc.getPageCount(), PDFNet.PageSet.Filter.e_even);
        stamper.stampPage(doc, pgOne, pgSet);

        await doc.save(outputPath + 'newsletter.ex6.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);

        await PDFNet.endDeallocateStack();
      } catch (err) {
        console.log(err.stack);
      }

      //--------------------------------------------------------------------------------
      // Example 7) Add image stamp at top right corner in every pages
      try {
        await PDFNet.startDeallocateStack();

        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        doc.initSecurityHandler();

        const stamper = await PDFNet.Stamper.create(PDFNet.Stamper.SizeType.e_relative_scale, 0.1, 0.1);
        stamper.setOpacity(0.8);
        stamper.setRotation(135);
        stamper.setAsBackground(false);
        stamper.showsOnPrint(false);
        stamper.setAlignment(PDFNet.Stamper.HorizontalAlignment.e_horizontal_left, PDFNet.Stamper.VerticalAlignment.e_vertical_top);
        stamper.setPosition(10, 10);

        const img = await PDFNet.Image.createFromFile(doc, inputPath + 'peppers.jpg');
        const pgSet = await PDFNet.PageSet.createFilteredRange(1, (await doc.getPageCount()), PDFNet.PageSet.Filter.e_all);
        stamper.stampImage(doc, img, pgSet);

        await doc.save(outputPath + 'newsletter.ex7.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);

        await PDFNet.endDeallocateStack();
      } catch (err) {
        console.log(err.stack);
      }

      //--------------------------------------------------------------------------------
      // Example 8) Add Text stamp to first 2 pages, and image stamp to first page.
      //          Because text stamp is set as background, the image is top of the text
      //          stamp. Text stamp on the first page is not visible.
      try {
        await PDFNet.startDeallocateStack();

        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        doc.initSecurityHandler();

        const stamper = await PDFNet.Stamper.create(PDFNet.Stamper.SizeType.e_relative_scale, 0.07, -0.1);
        stamper.setAlignment(PDFNet.Stamper.HorizontalAlignment.e_horizontal_right, PDFNet.Stamper.VerticalAlignment.e_vertical_bottom);
        stamper.setAlignment(PDFNet.Stamper.HorizontalAlignment.e_horizontal_center, PDFNet.Stamper.VerticalAlignment.e_vertical_top);
        const font = await PDFNet.Font.create(doc, PDFNet.Font.StandardType1Font.e_courier);
        stamper.setFont(font);
        const redColorPt = await PDFNet.ColorPt.init(1, 0, 0, 0);
        stamper.setFontColor(redColorPt);
        stamper.setTextAlignment(PDFNet.Stamper.TextAlignment.e_align_right);
        stamper.setAsBackground(true);

        const pgSet = await PDFNet.PageSet.createRange(1, 2);
        stamper.stampText(doc, 'This is a title!', pgSet);

        const img = await PDFNet.Image.createFromFile(doc, inputPath + 'peppers.jpg');
        stamper.setAsBackground(false);

        const pgSetImage = await PDFNet.PageSet.createRange(1, 1);
        stamper.stampImage(doc, img, pgSetImage);

        await doc.save(outputPath + 'newsletter.ex8.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);

        await PDFNet.endDeallocateStack();
      } catch (err) {
        console.log(err.stack);
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) { console.log('Error: ' + JSON.stringify(error)); }).then(function () { PDFNet.shutdown(); });
  };
  exports.runStamperTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=StamperTest.js