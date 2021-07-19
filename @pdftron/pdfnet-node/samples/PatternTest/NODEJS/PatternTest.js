//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runPatternTest = () => {
    const createTilingPattern = async (doc) => {
      const writer = await PDFNet.ElementWriter.create();
      const eb = await PDFNet.ElementBuilder.create();

      // Create a new pattern content stream - a heart. ------------
      writer.begin(doc);
      eb.pathBegin();
      eb.moveTo(0, 0);
      eb.curveTo(500, 500, 125, 625, 0, 500);
      eb.curveTo(-125, 625, -500, 500, 0, 0);
      const heart = await eb.pathEnd();
      heart.setPathFill(true);

      // Set heart color to red.
      const gstate = await heart.getGState();
      gstate.setFillColorSpace(await PDFNet.ColorSpace.createDeviceRGB());
      gstate.setStrokeColorWithColorPt(await PDFNet.ColorPt.init(1, 0, 0));
      writer.writeElement(heart);

      const patternDict = await writer.end();

      // Initialize pattern dictionary. For details on what each parameter represents please 
      // refer to Table 4.22 (Section '4.6.2 Tiling Patterns') in PDF Reference Manual.
      patternDict.putName('Type', 'Pattern');
      patternDict.putNumber('PatternType', 1);

      // TilingType - Constant spacing.
      patternDict.putNumber('TilingType', 1);

      // This is a Type1 pattern - A colored tiling pattern.
      patternDict.putNumber('PaintType', 1);

      // Set bounding box
      patternDict.putRect('BBox', -253, 0, 253, 545);

      // Create and set the matrix
      const pattern_mtx = await PDFNet.Matrix2D.create(0.04, 0, 0, 0.04, 0, 0);
      patternDict.putMatrix('Matrix', pattern_mtx);

      // Set the desired horizontal and vertical spacing between pattern cells, 
      // measured in the pattern coordinate system.
      patternDict.putNumber('XStep', 1000);
      await patternDict.putNumber('YStep', 1000);

      return patternDict; // finished creating the Pattern resource
    }

    const createImageTilingPattern = async (doc) => {
      const writer = await PDFNet.ElementWriter.create();
      const eb = await PDFNet.ElementBuilder.create();

      // Create a new pattern content stream - a single bitmap object ----------
      writer.begin(doc);
      const image = await PDFNet.Image.createFromFile(doc, '../../TestFiles/dice.jpg');
      const imgElement = await eb.createImageScaled(image, 0, 0, await image.getImageWidth(), await image.getImageHeight());
      writer.writePlacedElement(imgElement);

      const patternDict = await writer.end();

      // Initialize pattern dictionary. For details on what each parameter represents please 
      // refer to Table 4.22 (Section '4.6.2 Tiling Patterns') in PDF Reference Manual.
      patternDict.putName('Type', 'Pattern');
      patternDict.putNumber('PatternType', 1);

      // TilingType - Constant spacing.
      patternDict.putNumber('TilingType', 1);

      // This is a Type1 pattern - A colored tiling pattern.
      patternDict.putNumber('PaintType', 1);

      // Set bounding box
      patternDict.putRect('BBox', -253, 0, 253, 545);

      // Create and set the matrix
      const pattern_mtx = await PDFNet.Matrix2D.create(0.3, 0, 0, 0.3, 0, 0);
      patternDict.putMatrix('Matrix', pattern_mtx);

      // Set the desired horizontal and vertical spacing between pattern cells, 
      // measured in the pattern coordinate system.
      patternDict.putNumber('XStep', 300);
      await patternDict.putNumber('YStep', 300);

      return patternDict; // finished creating the Pattern resource
    }

    const createAxialShading = async (doc) => {
      // Create a new Shading object ------------
      const patternDict = await doc.createIndirectDict();

      // Initialize pattern dictionary. For details on what each parameter represents 
      // please refer to Tables 4.30 and 4.26 in PDF Reference Manual
      patternDict.putName('Type', 'Pattern');
      patternDict.putNumber('PatternType', 2); // 2 stands for shading

      const shadingDict = await patternDict.putDict('Shading');
      shadingDict.putNumber('ShadingType', 2);
      shadingDict.putName('ColorSpace', 'DeviceCMYK');

      // pass the coordinates of the axial shading to the output
      const shadingCoords = await shadingDict.putArray('Coords');
      shadingCoords.pushBackNumber(0);
      shadingCoords.pushBackNumber(0);
      shadingCoords.pushBackNumber(612);
      shadingCoords.pushBackNumber(794);

      // pass the function to the axial shading
      const func = await shadingDict.putDict('Function');
      const C0 = await func.putArray('C0');
      C0.pushBackNumber(1);
      C0.pushBackNumber(0);
      C0.pushBackNumber(0);
      await C0.pushBackNumber(0);

      const C1 = await func.putArray('C1');
      C1.pushBackNumber(0);
      C1.pushBackNumber(1);
      C1.pushBackNumber(0);
      await C1.pushBackNumber(0);

      const domain = await func.putArray('Domain');
      domain.pushBackNumber(0);
      await domain.pushBackNumber(1);

      func.putNumber('FunctionType', 2);
      await func.putNumber('N', 1);

      return patternDict;
    }

    const main = async () => {
      try {
        const doc = await PDFNet.PDFDoc.create();
        const writer = await PDFNet.ElementWriter.create();
        var eb = await PDFNet.ElementBuilder.create();

        // The following sample illustrates how to create and use tiling patterns
        var page = await doc.pageCreate();
        writer.beginOnPage(page);

        var element = await eb.createTextBeginWithFont(await PDFNet.Font.createAndEmbed(doc, PDFNet.Font.StandardType1Font.e_times_bold), 1);
        writer.writeElement(element);  // Begin the text block

        const data = 'G';
        element = await eb.createNewTextRunWithSize(data, data.length);
        element.setTextMatrixEntries(720, 0, 0, 720, 20, 240);
        var gs = await element.getGState();
        gs.setTextRenderMode(PDFNet.GState.TextRenderingMode.e_fill_stroke_text);
        gs.setLineWidth(4);

        // Set the fill color space to the Pattern color space. 
        gs.setFillColorSpace(await PDFNet.ColorSpace.createPattern());
        var patterColor = await PDFNet.PatternColor.create(await createTilingPattern(doc));
        gs.setFillColorWithPattern(patterColor);

        writer.writeElement(element);
        writer.writeElement(await eb.createTextEnd()); // Finish the text block

        writer.end();	// Save the page
        doc.pagePushBack(page);
        //-----------------------------------------------

        /// The following sample illustrates how to create and use image tiling pattern
        page = await doc.pageCreate();
        writer.beginOnPage(page);

        eb.reset();
        element = await eb.createRect(0, 0, 612, 794);

        // Set the fill color space to the Pattern color space. 
        gs = await element.getGState();
        gs.setFillColorSpace(await PDFNet.ColorSpace.createPattern());
        patterColor = await PDFNet.PatternColor.create(await createImageTilingPattern(doc));
        gs.setFillColorWithPattern(patterColor);
        element.setPathFill(true);

        writer.writeElement(element);

        await writer.end();	// Save the page
        doc.pagePushBack(page);
        //-----------------------------------------------

        /// The following sample illustrates how to create and use PDF shadings
        page = await doc.pageCreate();
        writer.beginOnPage(page);

        eb.reset();
        element = await eb.createRect(0, 0, 612, 794);

        // Set the fill color space to the Pattern color space. 
        gs = await element.getGState();
        gs.setFillColorSpace(await PDFNet.ColorSpace.createPattern());
        patterColor = await PDFNet.PatternColor.create(await createAxialShading(doc));
        gs.setFillColorWithPattern(patterColor);
        element.setPathFill(true);

        writer.writeElement(element);

        await writer.end();	// Save the page
        doc.pagePushBack(page);
        //-----------------------------------------------

        await doc.save('../../TestFiles/Output/patterns.pdf', PDFNet.SDFDoc.SaveOptions.e_remove_unused);
        console.log('Done. Result saved in patterns.pdf...');
      } catch (err) {
        console.log(err);
      }
    }
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function(){ PDFNet.shutdown(); });
  };
  exports.runPatternTest();
})(exports);
  // eslint-disable-next-line spaced-comment
  //# sourceURL=PatternTest.js