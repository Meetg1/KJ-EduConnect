//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------


const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runAddImageTest = () => {

    const main = async() => {
      try {
        // Relative path to the folder containing test files.
        const inputURL = '../../TestFiles/';

        const doc = await PDFNet.PDFDoc.create();
        doc.initSecurityHandler();

        const builder = await PDFNet.ElementBuilder.create(); // ElementBuilder, used to build new element Objects
        // create a new page writer that allows us to add/change page elements
        const writer = await PDFNet.ElementWriter.create(); // ElementWriter, used to write elements to the page
        // define new page dimensions
        let page = await doc.pageCreate();

        writer.beginOnPage(page, PDFNet.ElementWriter.WriteMode.e_overlay);

        // Adding a JPEG image to output file
        let img = await PDFNet.Image.createFromFile(doc, inputURL + 'peppers.jpg');
        let imgWidth = await img.getImageWidth();
        let imgHeight = await img.getImageHeight();
        let element = await builder.createImageScaled(img, 50, 500, imgWidth/2, imgHeight/2);
        writer.writePlacedElement(element);

        // Add a PNG to output file
        img = await PDFNet.Image.createFromFile(doc, inputURL + 'butterfly.png');
        matrix = await PDFNet.Matrix2D.create(100, 0, 0, 100, 300, 500);
        element = await builder.createImageFromMatrix(img, matrix);
        writer.writePlacedElement(element);

        // Add a GIF image to the output file
        img = await PDFNet.Image.createFromFile(doc, inputURL + 'pdfnet.gif');
        imgWidth = await img.getImageWidth();
        imgHeight = await img.getImageHeight();
        matrix = await PDFNet.Matrix2D.create(imgWidth, 0, 0, imgHeight, 50, 350);
        element = await builder.createImageFromMatrix(img, matrix);
        writer.writePlacedElement(element);

        // Add a TIFF image to the output file
        img = await PDFNet.Image.createFromFile(doc, inputURL + 'grayscale.tif');
        imgWidth = await img.getImageWidth();
        imgHeight = await img.getImageHeight();
        matrix = await PDFNet.Matrix2D.create(imgWidth, 0, 0, imgHeight, 10, 50);
        element = await builder.createImageFromMatrix(img, matrix);
        writer.writePlacedElement(element);

        writer.end();
        doc.pagePushBack(page);

        // Embed monochrome TIFF compressed using lossy JBIG2 filter
        const pageRect = await PDFNet.Rect.init(0, 0, 612, 794);
        page = await doc.pageCreate(pageRect);
        writer.beginOnPage(page);

        const hintSet = await PDFNet.ObjSet.create();
        const enc = await hintSet.createArray();
        await enc.pushBackName('JBIG2');
        await enc.pushBackName('Lossy');

        img = await PDFNet.Image.createFromFile(doc, inputURL + 'multipage.tif', enc);
        matrix = await PDFNet.Matrix2D.create(612, 0, 0, 794, 0, 0);
        element = await builder.createImageFromMatrix(img, matrix);
        writer.writePlacedElement(element);

        writer.end();
        doc.pagePushBack(page);

        // Add a JPEG200 to output file
        page = await doc.pageCreate();
        writer.beginOnPage(page);

        img = await PDFNet.Image.createFromFile(doc, inputURL + 'palm.jp2');
        imgWidth = await img.getImageWidth();
        imgHeight = await img.getImageHeight();
        matrix = await PDFNet.Matrix2D.create(imgWidth, 0, 0, imgHeight, 96, 80);
        element = await builder.createImageFromMatrix(img, matrix);
        writer.writePlacedElement(element);

        // write 'JPEG2000 Sample' text under image
        const timesFont = await PDFNet.Font.create(doc, PDFNet.Font.StandardType1Font.e_times_roman);
        writer.writeElement(await builder.createTextBeginWithFont(timesFont, 32));
        element = await builder.createNewTextRun('JPEG2000 Sample');
        matrix = await PDFNet.Matrix2D.create(1, 0, 0, 1, 190, 30);
        await element.setTextMatrix(matrix);
        writer.writeElement(element);
        const element2 = await builder.createTextEnd();
        writer.writeElement(element2);

        await writer.end();
        doc.pagePushBack(page); // add the page to the document

        await doc.save(inputURL + 'Output/addimage.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);

        console.log('Done. Result saved in addimage.pdf...');
      } catch (err) {
        console.log(err);
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error){console.log('Error: ' + JSON.stringify(error));}).then(function(){PDFNet.shutdown();});
  };
  exports.runAddImageTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=AddImageTest.js