//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// The following sample illustrates how to convert PDF documents to various raster image 
// formats (such as PNG, JPEG, BMP, TIFF, etc), as well as how to convert a PDF page to 
// GDI+ Bitmap for further manipulation and/or display in WinForms applications.
//---------------------------------------------------------------------------------------

const fs = require('fs');
const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runPDFDrawTest = () => {

    const main = async () => {
      // Relative path to the folder containing test files.
      const inputPath = '../../TestFiles/';
      const outputPath = inputPath + 'Output/';

      try {

        // Optional: Set ICC color profiles to fine tune color conversion 
        // for PDF 'device' color spaces...

        // PDFNet.setResourcesPath('../../resources');
        // PDFNet.setColorManagement(PDFNet.CMSType.e_lcms);
        // PDFNet.setDefaultDeviceCMYKProfile('D:/Misc/ICC/USWebCoatedSWOP.icc');
        // PDFNet.setDefaultDeviceRGBProfile('AdobeRGB1998.icc'); // will search in PDFNet resource folder.

        // ----------------------------------------------------
        // Optional: Set predefined font mappings to override default font 
        // substitution for documents with missing fonts...

        // PDFNet.addFontSubst('StoneSans-Semibold', 'C:/WINDOWS/Fonts/comic.ttf');
        // PDFNet.addFontSubst('StoneSans', 'comic.ttf');  // search for 'comic.ttf' in PDFNet resource folder.
        // PDFNet.addFontSubst(PDFNet.CharacterOrdering.e_Identity, 'C:/WINDOWS/Fonts/arialuni.ttf');
        // PDFNet.addFontSubst(PDFNet.CharacterOrdering.e_Japan1, 'C:/Program Files/Adobe/Acrobat 7.0/Resource/CIDFont/KozMinProVI-Regular.otf');
        // PDFNet.addFontSubst(PDFNet.CharacterOrdering.e_Japan2, 'c:/myfonts/KozMinProVI-Regular.otf');
        // PDFNet.addFontSubst(PDFNet.CharacterOrdering.e_Korea1, 'AdobeMyungjoStd-Medium.otf');
        // PDFNet.addFontSubst(PDFNet.CharacterOrdering.e_CNS1, 'AdobeSongStd-Light.otf');
        // PDFNet.addFontSubst(PDFNet.CharacterOrdering.e_GB1, 'AdobeMingStd-Light.otf');

        const draw = await PDFNet.PDFDraw.create();  // PDFDraw class is used to rasterize PDF pages.

        //--------------------------------------------------------------------------------
        // Example 1) Convert the first page to PNG and TIFF at 92 DPI. 
        // A three step tutorial to convert PDF page to an image.
        try {
          // A) Open the PDF document.
          const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'tiger.pdf');

          // Initialize the security handler, in case the PDF is encrypted.
          doc.initSecurityHandler();

          // B) The output resolution is set to 92 DPI.
          draw.setDPI(92);

          const firstPage = await (await doc.getPageIterator()).current();
          // C) Rasterize the first page in the document and save the result as PNG.
          await draw.export(firstPage, outputPath + 'tiger_92dpi.png');

          console.log('Example 1: tiger_92dpi.png');

          // Export the same page as TIFF
          await draw.export(firstPage, outputPath + 'tiger_92dpi.tif', 'TIFF');
        } catch (err) {
          console.log(err);
        }

        //--------------------------------------------------------------------------------
        // Example 2) Convert the all pages in a given document to JPEG at 72 DPI.
        console.log('Example 2:');
        const hint_set = await PDFNet.ObjSet.create(); //  A collection of rendering 'hits'.
        try {
          const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
          // Initialize the security handler, in case the PDF is encrypted.
          doc.initSecurityHandler();

          draw.setDPI(72); // Set the output resolution is to 72 DPI.

          // Use optional encoder parameter to specify JPEG quality.
          const encoderParam = await hint_set.createDict();
          await encoderParam.putNumber('Quality', 80);

          // Traverse all pages in the document.
          for (const itr = await doc.getPageIterator(); await itr.hasNext(); await itr.next()) {
            const currPage = await itr.current();
            const currPageIdx = await currPage.getIndex();
            const path = outputPath + 'newsletter' + currPageIdx + '.jpg';
            console.log('newsletter' + currPageIdx + '.jpg');

            await draw.export(currPage, path, 'JPEG', encoderParam);
          }
          console.log('Done.');
        } catch (err) {
          console.log(err);
        }

        // Examples 3-6
        try {
          // Common code for remaining samples.
          const tiger_doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'tiger.pdf');
          // Initialize the security handler, in case the PDF is encrypted.
          tiger_doc.initSecurityHandler();
          const page = await tiger_doc.getPage(1);

          //--------------------------------------------------------------------------------
          // Example 3) Convert the first page to raw bitmap. Also, rotate the 
          // page 90 degrees and save the result as RAW.
          draw.setDPI(100); // Set the output resolution is to 100 DPI.
          draw.setRotate(PDFNet.Page.Rotate.e_90);  // Rotate all pages 90 degrees clockwise.

          const bitmapInfo = await draw.getBitmap(page, PDFNet.PDFDraw.PixelFormat.e_rgb, false);
          const buf = Buffer.from(bitmapInfo.buf, 0, bitmapInfo.height * bitmapInfo.stride)

          // Save the raw RGB data to disk.
          fs.appendFileSync(outputPath + 'tiger_100dpi_rot90.raw', buf, 'binary');

          console.log('Example 3: tiger_100dpi_rot90.raw');
          draw.setRotate(PDFNet.Page.Rotate.e_0);  // Disable image rotation for remaining samples.

          //--------------------------------------------------------------------------------
          // Example 4) Convert PDF page to a fixed image size. Also illustrates some 
          // other features in PDFDraw class such as rotation, image stretching, exporting 
          // to grayscale, or monochrome.

          // Initialize render 'gray_hint' parameter, that is used to control the 
          // rendering process. In this case we tell the rasterizer to export the image as 
          // 1 Bit Per Component (BPC) image.
          const mono_hint = await hint_set.createDict();
          await mono_hint.putNumber('BPC', 1);

          // SetImageSize can be used instead of SetDPI() to adjust page  scaling 
          // dynamically so that given image fits into a buffer of given dimensions.
          draw.setImageSize(1000, 1000);		// Set the output image to be 1000 wide and 1000 pixels tall
          draw.export(page, outputPath + 'tiger_1000x1000.png', 'PNG', mono_hint);
          console.log('Example 4: tiger_1000x1000.png');

          draw.setImageSize(200, 400);	    // Set the output image to be 200 wide and 300 pixels tall
          draw.setRotate(PDFNet.Page.Rotate.e_180);  // Rotate all pages 90 degrees clockwise.

          // 'gray_hint' tells the rasterizer to export the image as grayscale.
          const gray_hint = await hint_set.createDict();
          await gray_hint.putName('ColorSpace', 'Gray');

          await draw.export(page, outputPath + 'tiger_200x400_rot180.png', 'PNG', gray_hint);
          console.log('Example 4: tiger_200x400_rot180.png');

          draw.setImageSize(400, 200, false);  // The third parameter sets 'preserve-aspect-ratio' to false.
          draw.setRotate(PDFNet.Page.Rotate.e_0);    // Disable image rotation.
          await draw.export(page, outputPath + 'tiger_400x200_stretch.jpg', 'JPEG');
          console.log('Example 4: tiger_400x200_stretch.jpg');

          //--------------------------------------------------------------------------------
          // Example 5) Zoom into a specific region of the page and rasterize the 
          // area at 200 DPI and as a thumbnail (i.e. a 50x50 pixel image).
          const zoom_rect = await PDFNet.Rect.init(216, 522, 330, 600);
          await page.setCropBox(zoom_rect);	// Set the page crop box.

          // Select the crop region to be used for drawing.
          draw.setPageBox(PDFNet.Page.Box.e_crop);
          draw.setDPI(900);  // Set the output image resolution to 900 DPI.
          await draw.export(page, outputPath + 'tiger_zoom_900dpi.png', 'PNG');
          console.log('Example 5: tiger_zoom_900dpi.png');

          // -------------------------------------------------------------------------------
          // Example 6)
          draw.setImageSize(50, 50);	   // Set the thumbnail to be 50x50 pixel image.
          await draw.export(page, outputPath + 'tiger_zoom_50x50.png', 'PNG');
          console.log('Example 6: tiger_zoom_50x50.png');
        } catch (err) {
          console.log(err);
        }

        //--------------------------------------------------------------------------------
        // Example 7) Convert the first PDF page to CMYK TIFF at 92 DPI.
        // A three step tutorial to convert PDF page to an image
        try {
          const cmyk_hint = await hint_set.createDict();
          await cmyk_hint.putName('ColorSpace', 'CMYK');
          // A) Open the PDF document.
          const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'tiger.pdf');
          // Initialize the security handler, in case the PDF is encrypted.
          doc.initSecurityHandler();

          // B) The output resolution is set to 92 DPI.
          draw.setDPI(92);

          // C) Rasterize the first page in the document and save the result as TIFF.
          const pg = await doc.getPage(1);
          await draw.export(pg, outputPath + 'out1.tif', 'TIFF', cmyk_hint);
          console.log('Example 7: out1.tif');
        } catch (err) {
          console.log(err);
        }

        //--------------------------------------------------------------------------------
        // Example 8) PDFRasterizer can be used for more complex rendering tasks, such as 
        // strip by strip or tiled document rendering. In particular, it is useful for 
        // cases where you cannot simply modify the page crop box (interactive viewing,
        // parallel rendering).  This example shows how you can rasterize the south-west
        // quadrant of a page.
        try {
          // A) Open the PDF document.
          const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'tiger.pdf');
          // Initialize the security handler, in case the PDF is encrypted.
          doc.initSecurityHandler();

          // B) Get the page matrix 
          const pg = await doc.getPage(1);
          const box = PDFNet.Page.Rotate.e_crop;
          let mtx = await pg.getDefaultMatrix(true, box);
          // We want to render a quadrant, so use half of width and height
          const pg_w = await pg.getPageWidth(box) / 2;
          const pg_h = await pg.getPageHeight(box) / 2;

          // C) Scale matrix from PDF space to buffer space
          const dpi = 96.0;
          const scale = dpi / 72.0; // PDF space is 72 dpi
          const buf_w = Math.floor(scale * pg_w);
          const buf_h = Math.floor(scale * pg_h);
          const bytes_per_pixel = 4; // BGRA buffer
          await mtx.translate(0, -pg_h); // translate by '-pg_h' since we want south-west quadrant
          const scale_mtx = await PDFNet.Matrix2D.create(scale, 0, 0, scale, 0, 0);
          await scale_mtx.multiply(mtx);
          mtx = scale_mtx;

          // D) Rasterize page into memory buffer, according to our parameters
          const rast = await PDFNet.PDFRasterizer.create();
          const buf = await rast.rasterize(pg, buf_w, buf_h, buf_w * bytes_per_pixel, bytes_per_pixel, true, mtx);

          // buf now contains raw BGRA bitmap.
          console.log('Example 8: Successfully rasterized into memory buffer.');
        } catch (err) {
          console.log(err);
        }

        //--------------------------------------------------------------------------------
        // Example 9) Export raster content to PNG using different image smoothing settings. 
        try {
          const text_doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'lorem_ipsum.pdf');
          text_doc.initSecurityHandler();
          const itr = await text_doc.getPageIterator();
          const page = await itr.current();

          draw.setImageSmoothing(false, false);
          let filename = 'raster_text_no_smoothing.png';
          await draw.export(page, outputPath + filename);
          console.log('Example 9 a): ' + filename + '. Done.');

          filename = 'raster_text_smoothed.png';
          draw.setImageSmoothing(true, false /*default quality bilinear resampling*/);
          await draw.export(page, outputPath + filename);
          console.log('Example 9 b): ' + filename + '. Done.');

          filename = 'raster_text_high_quality.png';
          draw.setImageSmoothing(true, true /*high quality area resampling*/);
          await draw.export(page, outputPath + filename);
          console.log('Example 9 c): ' + filename + '. Done.');
        } catch (err) {
          console.log(err);
        }

        //--------------------------------------------------------------------------------
        // Example 10) Export separations directly, without conversion to an output colorspace
        try {
          const separation_doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'op_blend_test.pdf');
          separation_doc.initSecurityHandler();
          const separation_hint = await hint_set.createDict();
          await separation_hint.putName('ColorSpace', 'Separation');
          draw.setDPI(96);
          draw.setImageSmoothing(true, true);
          draw.setOverprint(PDFNet.PDFRasterizer.OverprintPreviewMode.e_op_on);

          const itr = await separation_doc.getPageIterator();
          const page = await itr.current();
          let filename = 'merged_separations.png';
          await draw.export(page, outputPath + filename, 'PNG');
          console.log('Example 10 a): ' + filename + '. Done.');

          filename = 'separation';
          await draw.export(page, outputPath + filename, 'PNG', separation_hint);
          console.log('Example 10 b): ' + filename + '_[ink].png. Done.');

          filename = 'separation_NChannel.tif';
          await draw.export(page, outputPath + filename, 'TIFF', separation_hint);
          console.log('Example 10 c): ' + filename + '. Done.');
        } catch (err) {
          console.log(err);
        }
      } catch (err) {
        console.log(err);
      }
    };

    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) { console.log('Error: ' + JSON.stringify(error)); }).then(function () { PDFNet.shutdown(); });
  };
  exports.runPDFDrawTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=PDFDrawTest.js