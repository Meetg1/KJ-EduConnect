//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------


const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runElementEditTest = () => {

    async function ProcessElements(reader, writer, visited) {
      await PDFNet.startDeallocateStack();
      const colorspace = await PDFNet.ColorSpace.createDeviceRGB();
      const redColor = await PDFNet.ColorPt.init(1, 0, 0);
      const blueColor = await PDFNet.ColorPt.init(0, 0, 1);

      for (let element = await reader.next(); element !== null; element = await reader.next()) {
        const elementType = await element.getType();
        let gs;
        let formObj;
        let formObjNum = null;
        switch (elementType) {
          case PDFNet.Element.Type.e_image:
          case PDFNet.Element.Type.e_inline_image:
            // remove all images by skipping them
            break;
          case PDFNet.Element.Type.e_path:
            // Set all paths to red
            gs = await element.getGState();
            gs.setFillColorSpace(colorspace);
            gs.setFillColorWithColorPt(redColor);
            writer.writeElement(element);
            break;
          case PDFNet.Element.Type.e_text:
            // Set all text to blue
            gs = await element.getGState();
            gs.setFillColorSpace(colorspace);
            gs.setFillColorWithColorPt(blueColor);
            writer.writeElement(element);
            break;
          case PDFNet.Element.Type.e_form:
            writer.writeElement(element);
            formObj = await element.getXObject();
            formObjNum = formObj.getObjNum();
            // if XObject not yet processed
            if (visited.indexOf(formObjNum) === -1) {
              // Set Replacement
              const insertedObj = await formObj.getObjNum();
              if (!visited.includes(insertedObj)) {
                visited.push(insertedObj);
              }
              const newWriter = await PDFNet.ElementWriter.create();
              reader.formBegin();
              newWriter.beginOnObj(formObj);
              await ProcessElements(reader, newWriter, visited);
              newWriter.end();
              reader.end();
            }
            break;
          default:
            writer.writeElement(element);
        }
      }
      await PDFNet.endDeallocateStack();
    }

    const main = async () => {
      // Relative path to the folder containing test files.
      const inputPath = '../../TestFiles/';
      try {
        console.log('Opening the input file...');
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        doc.initSecurityHandler();

        const writer = await PDFNet.ElementWriter.create();
        const reader = await PDFNet.ElementReader.create();
        const visited = [];

        const itr = await doc.getPageIterator(1);

        // Process each page in the document
        for (itr; await itr.hasNext(); itr.next()) {
          const page = await itr.current();
          const sdfObj = await page.getSDFObj();
          const insertedObj = await sdfObj.getObjNum();
          if (!visited.includes(insertedObj)) {
            visited.push(insertedObj);
          }
          reader.beginOnPage(page);
          writer.beginOnPage(page, PDFNet.ElementWriter.WriteMode.e_replacement, false, true, await page.getResourceDict());
          await ProcessElements(reader, writer, visited);
          writer.end();
          reader.end();
        }

        await doc.save(inputPath + 'Output/newsletter_edited.pdf', PDFNet.SDFDoc.SaveOptions.e_remove_unused);
        console.log('Done. Result saved in newsletter_edited.pdf...');
      } catch (err) {
        console.log(err);
      }
    };

    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) { console.log('Error: ' + JSON.stringify(error)); }).then(function () { PDFNet.shutdown(); });
  };
  exports.runElementEditTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=ElementEditTest.js