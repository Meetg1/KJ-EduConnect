//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------
// This sample demonstrates how to create layers in PDF.
// The sample also shows how to extract and render PDF layers in documents 
// that contain optional content groups (OCGs)
//
// With the introduction of PDF version 1.5 came the concept of Layers. 
// Layers, or as they are more formally known Optional Content Groups (OCGs),
// refer to sections of content in a PDF document that can be selectively 
// viewed or hidden by document authors or consumers. This capability is useful 
// in CAD drawings, layered artwork, maps, multi-language documents etc.
// 
// Notes: 
// ---------------------------------------
// - This sample is using CreateLayer() utility method to create new OCGs. 
//   CreateLayer() is relatively basic, however it can be extended to set 
//   other optional entries in the 'OCG' and 'OCProperties' dictionary. For 
//   a complete listing of possible entries in OC dictionary please refer to 
//   section 4.10 'Optional Content' in the PDF Reference Manual.
// - The sample is grouping all layer content into separate Form XObjects. 
//   Although using PDFNet is is also possible to specify Optional Content in 
//   Content Streams (Section 4.10.2 in PDF Reference), Optional Content in  
//   XObjects results in PDFs that are cleaner, less-error prone, and faster 
//   to process.
//-----------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runPDFLayersTest = () => {
    const inputPath =  '../../TestFiles/';
    const outputPath = inputPath + 'Output/';

    // A utility function used to add new Content Groups (Layers) to the document.
    const CreateLayer = async(doc, layerName) => {
      await PDFNet.startDeallocateStack();
      const grp = await PDFNet.OCG.create(doc, layerName);
      let cfg = await doc.getOCGConfig();
      if (cfg == null) {
        cfg = await PDFNet.OCGConfig.create(doc, true);
        cfg.setName('Default');
      }

      // Add the new OCG to the list of layers that should appear in PDF viewer GUI.
      let layerOrderArray = await cfg.getOrder();
      if (layerOrderArray == null) {
        layerOrderArray = await doc.createIndirectArray();
        cfg.setOrder(layerOrderArray);
      }
      const grpSDFObj = await grp.getSDFObj();
      layerOrderArray.pushBack(grpSDFObj);

      await PDFNet.endDeallocateStack();
      return grp;
    };

    // Creates some content (3 images) and associate them with the image layer
    const CreateGroup1 = async(doc, layer) => {
      await PDFNet.startDeallocateStack();
      const writer = await PDFNet.ElementWriter.create();
      writer.begin(doc);

      // Create an Image that can be reused in the document or on the same page.
      const img = await PDFNet.Image.createFromFile(doc, inputPath + 'peppers.jpg');

      const builder = await PDFNet.ElementBuilder.create();
      const imgWidth = await img.getImageWidth();
      const imgHeight = await img.getImageHeight();
      const imgMatrix = new PDFNet.Matrix2D(imgWidth / 2, -145, 20, imgHeight / 2, 200, 150);
      const element = await builder.createImageFromMatrix(img, imgMatrix);
      writer.writePlacedElement(element);

      const gstate = await element.getGState(); // use the same image (just change its matrix)
      gstate.setTransform(200, 0, 0, 300, 50, 450);
      writer.writePlacedElement(element);

      // use the same image again (just change its matrix).
      writer.writePlacedElement(await builder.createImageScaled(img, 300, 600, 200, -150));

      const grpObj = await writer.end();

      // Indicate that this form (content group) belongs to the given layer (OCG).
      grpObj.putName('Subtype', 'Form');
      grpObj.put('OC', layer);
      grpObj.putRect('BBox', 0, 0, 1000, 1000); // Set the clip box for the content.
      await PDFNet.endDeallocateStack();

      return grpObj;
    };

    const CreateGroup2 = async(doc, layer) => {
      await PDFNet.startDeallocateStack();
      const writer = await PDFNet.ElementWriter.create();
      writer.begin(doc);

      // Create a path object in the shape of a heart.
      const builder = await PDFNet.ElementBuilder.create();
      builder.pathBegin(); // start constructing the path
      builder.moveTo(306, 396);
      builder.curveTo(681, 771, 399.75, 864.75, 306, 771);
      builder.curveTo(212.25, 864.75, -69, 771, 306, 396);
      builder.closePath();
      const element = await builder.pathEnd(); // the path geometry is now specified.

      // Set the path FILL color space and color.
      element.setPathFill(true);
      const gstate = await element.getGState();
      const CMYKSpace = await PDFNet.ColorSpace.createDeviceCMYK();
      gstate.setFillColorSpace(CMYKSpace);
      const cyanColorPt = await PDFNet.ColorPt.init(1, 0, 0, 0); // CMYK
      gstate.setFillColorWithColorPt(cyanColorPt); // cyan

      // Set the path STROKE color space and color.
      element.setPathStroke(true);
      const RGBSpace = await PDFNet.ColorSpace.createDeviceRGB();
      gstate.setStrokeColorSpace(RGBSpace);
      const redColorPt = await PDFNet.ColorPt.init(1, 0, 0); // RGB
      gstate.setStrokeColorWithColorPt(redColorPt); // red
      gstate.setLineWidth(20);

      gstate.setTransform(0.5, 0, 0, 0.5, 280, 300);

      writer.writeElement(element);

      const grpObj = await writer.end();

      // Indicate that this form (content group) belongs to the given layer (OCG).
      grpObj.putName('Subtype', 'Form');
      grpObj.put('OC', layer);
      grpObj.putRect('BBox', 0, 0, 1000, 1000); // Set the clip box for the content.

      await PDFNet.endDeallocateStack();
      return grpObj;
    };

    const CreateGroup3 = async(doc, layer) => {
      await PDFNet.startDeallocateStack();
      const writer = await PDFNet.ElementWriter.create();
      writer.begin(doc);

      const builder = await PDFNet.ElementBuilder.create();

      // Begin writing a block of text
      const textFont = await PDFNet.Font.create(doc, PDFNet.Font.StandardType1Font.e_times_roman);
      let element = await builder.createTextBeginWithFont(textFont, 120);
      writer.writeElement(element);

      element = await builder.createNewTextRun('A text layer!');

      // Rotate text 45 degrees, than translate 180 pts horizontally and 100 pts vertically.
      const transform = await PDFNet.Matrix2D.createRotationMatrix(-45 * (3.1415 / 180.0));
      await transform.concat(1, 0, 0, 1, 180, 100);
      await element.setTextMatrix(transform);

      await writer.writeElement(element);
      await writer.writeElement(await builder.createTextEnd());

      const grpObj = await writer.end();

      // Indicate that this form (content group) belongs to the given layer (OCG).
      grpObj.putName('Subtype', 'Form');
      grpObj.put('OC', layer);
      grpObj.putRect('BBox', 0, 0, 1000, 1000); // Set the clip box for the content.
      await PDFNet.endDeallocateStack();
      return grpObj;
    };


    const main = async() => {
      try {
        const doc = await PDFNet.PDFDoc.create();
        doc.initSecurityHandler();

        const imageLayer = await CreateLayer(doc, 'Image Layer');
        const textLayer = await CreateLayer(doc, 'Text Layer');
        const vectorLayer = await CreateLayer(doc, 'Vector Layer');

        // Start a new page ------------------------------------
        const page = await doc.pageCreate();

        const builder = await PDFNet.ElementBuilder.create();	 // ElementBuilder is used to build new Element objects
        const writer = await PDFNet.ElementWriter.create();  // ElementWriter is used to write Elements to the page
        writer.beginOnPage(page);  // Begin writing to the page

        const groupObj = await CreateGroup1(doc, (await imageLayer.getSDFObj()));
        let element = await builder.createFormFromStream(groupObj);
        writer.writeElement(element);

        const groupObj2 = await CreateGroup2(doc, (await vectorLayer.getSDFObj()));
        element = await builder.createFormFromStream(groupObj2);
        writer.writeElement(element);

        // eslint-disable-next-line no-constant-condition
        if (false) {
          // A bit more advanced example of how to create an OCMD text layer that
          // is visible only if text, image and path layers are all 'ON'.
          // An example of how to set 'Visibility Policy' in OCMD.
          const ocgs = doc.createIndirectArray();
          ocgs.pushBack(await imageLayer.getSDFObj());
          ocgs.pushBack(await vectorLayer.getSDFObj());
          ocgs.PushBack(await textLayer.getSDFObj());
          const textOcmd = await PDFNet.OCMD.create(doc, ocgs, PDFNet.OCMD.VisibilityPolicyType.e_AllOn);
          element = await builder.createFormFromStream(await CreateGroup3(doc, (await textOcmd.getSDFObj())));
        } else {
          // let SDFObj = await textLayer.getSDFObj();
          element = await builder.createFormFromStream(await CreateGroup3(doc, (await textLayer.getSDFObj())));
        }
        writer.writeElement(element);

        // Add some content to the page that does not belong to any layer...
        // In this case this is a rectangle representing the page border.
        element = await builder.createRect(0, 0, (await page.getPageWidth()), (await page.getPageHeight()));
        element.setPathFill(false);
        element.setPathStroke(true);
        const elementGState = await element.getGState();
        elementGState.setLineWidth(40);
        writer.writeElement(element);

        writer.end(); // save changes to the current page
        doc.pagePushBack(page);

        // Set the default viewing preference to display 'Layer' tab.
        const prefs = await doc.getViewPrefs();
        prefs.setPageMode(PDFNet.PDFDocViewPrefs.PageMode.e_UseOC);

        await doc.save(outputPath + 'pdf_layers.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
        console.log('Done.');
      } catch (err) {
        // console.log(err);
        console.log(err.stack);
      }

	// The following is a code snippet shows how to selectively render 
	// and export PDF layers.
      try {
        const doc = await PDFNet.PDFDoc.createFromFilePath(outputPath + 'pdf_layers.pdf');
        doc.initSecurityHandler();

        if (!(await doc.hasOC())) {
          console.log("The document does not contain 'Optional Content'");
        } else {
          const initCfg = await doc.getOCGConfig();
          const ctx = await PDFNet.OCGContext.createFromConfig(initCfg);

          const pdfdraw = await PDFNet.PDFDraw.create();
          pdfdraw.setImageSize(1000, 1000);
          pdfdraw.setOCGContext(ctx);

          const page = await doc.getPage(1);

          await pdfdraw.export(page, outputPath + 'pdf_layers_default.png');

          // Disable drawing of content that is not optional (i.e. is not part of any layer).
          ctx.setNonOCDrawing(false);

          // Now render each layer in the input document to a separate image.
          const ocgs = await doc.getOCGs();
          if (ocgs !== null) {
            let i;
            const sz = await ocgs.size();
            for (i = 0; i < sz; ++i) {
              const ocg = await PDFNet.OCG.createFromObj(await ocgs.getAt(i));
              ctx.resetStates(false);
              await ctx.setState(ocg, true);
              let fname = 'pdf_layers_';
              fname += await ocg.getName();
              fname += '.png';
              console.log(fname);
              await pdfdraw.export(page, outputPath + fname);
            }
          }

          // Now draw content that is not part of any layer...
          ctx.setNonOCDrawing(true);
          await ctx.setOCDrawMode(PDFNet.OCGContext.OCDrawMode.e_NoOC);
          await pdfdraw.export(page, outputPath + 'pdf_layers_non_oc.png');
        }

        console.log('Done.');
      } catch (err) {
        console.log(err.stack);
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error){console.log('Error: ' + JSON.stringify(error));}).then(function(){PDFNet.shutdown();});
  };
  exports.runPDFLayersTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=PDFLayersTest.js